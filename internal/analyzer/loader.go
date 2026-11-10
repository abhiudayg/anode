package analyzer

import (
	"fmt"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
	"golang.org/x/tools/go/callgraph"
	"golang.org/x/tools/go/callgraph/vta"
	"golang.org/x/tools/go/packages"
	"golang.org/x/tools/go/ssa"
	"golang.org/x/tools/go/ssa/ssautil"
)

type Loader struct {
	rootDir string
}

func NewLoader(rootDir string) *Loader {
	return &Loader{rootDir: rootDir}
}

// LoadAndAnalyze loads Go packages, builds SSA, runs reachability, and extracts the IAG
func (l *Loader) LoadAndAnalyze(pattern string) (*iag.Graph, error) {
	cfg := &packages.Config{
		Mode: packages.NeedName | packages.NeedFiles | packages.NeedCompiledGoFiles |
			packages.NeedImports | packages.NeedTypes | packages.NeedTypesSizes |
			packages.NeedSyntax | packages.NeedTypesInfo | packages.NeedDeps,
		Dir: l.rootDir,
	}

	pkgs, err := packages.Load(cfg, pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to load packages: %w", err)
	}
	if packages.PrintErrors(pkgs) > 0 {
		return nil, fmt.Errorf("package loading had errors")
	}

	prog, ssaPkgs := ssautil.AllPackages(pkgs, ssa.SanityCheckFunctions|ssa.InstantiateGenerics)
	prog.Build()

	graph := &iag.Graph{
		SchemaVersion: iag.V1,
		Resources:     make(map[string]iag.Resource),
		Services:      []iag.Service{},
		EgressRules:   []iag.EgressRule{},
		Diagnostics:   []iag.Diagnostic{},
	}

	allFuncs := ssautil.AllFunctions(prog)
	cg := vta.CallGraph(allFuncs, nil)

	var mainFns []*ssa.Function
	for _, spkg := range ssaPkgs {
		if spkg != nil && spkg.Pkg.Name() == "main" {
			if mainFn := spkg.Func("main"); mainFn != nil {
				mainFns = append(mainFns, mainFn)
			}
		}
	}

	if len(mainFns) == 0 {
		return nil, fmt.Errorf("no main() packages found in %s", l.rootDir)
	}

	inspector := NewSinkInspector(l.rootDir, prog.Fset)

	for _, mainFn := range mainFns {
		serviceName := extractServiceName(mainFn)
		entrypoint := extractEntrypoint(l.rootDir, mainFn)

		svc := iag.Service{
			Name:       serviceName,
			Entrypoint: entrypoint,
			Ingress:    []iag.Ingress{},
			Bindings:   []iag.Binding{},
			Secrets:    []iag.SecretRef{},
		}

		reachable := getReachableFunctions(cg, mainFn)

		for fn := range reachable {
			for _, b := range fn.Blocks {
				for _, instr := range b.Instrs {
					if call, ok := instr.(ssa.CallInstruction); ok {
						if common := call.Common(); common != nil {
							inspector.InspectCall(fn, common, &svc, graph)
							inspector.InspectEnvCall(common, &svc)
						}
					}
				}
			}
		}

		graph.Services = append(graph.Services, svc)
	}

	// Link cross-service topologies and validate unresolved bindings
	l.linkServices(graph)

	return graph, nil
}

func extractServiceName(mainFn *ssa.Function) string {
	if mainFn.Pos().IsValid() {
		dir := filepath.Dir(mainFn.Prog.Fset.File(mainFn.Pos()).Name())
		base := filepath.Base(dir)
		if base != "." && base != "/" && base != "cmd" && base != "services" {
			return base
		}
	}
	return "service"
}

func extractEntrypoint(rootDir string, mainFn *ssa.Function) string {
	if mainFn.Pos().IsValid() {
		dir := filepath.Dir(mainFn.Prog.Fset.File(mainFn.Pos()).Name())
		rel, err := filepath.Rel(rootDir, dir)
		if err == nil {
			return "./" + rel
		}
		return "./" + filepath.Base(dir)
	}
	return "./"
}

func getReachableFunctions(cg *callgraph.Graph, root *ssa.Function) map[*ssa.Function]bool {
	reachable := make(map[*ssa.Function]bool)
	node := cg.Nodes[root]
	if node == nil {
		reachable[root] = true
		return reachable
	}

	var queue []*callgraph.Node
	queue = append(queue, node)
	reachable[root] = true

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		for _, edge := range curr.Out {
			callee := edge.Callee.Func
			if callee != nil && !reachable[callee] {
				reachable[callee] = true
				if edge.Callee != nil {
					queue = append(queue, edge.Callee)
				}
			}
		}
	}
	return reachable
}

func (l *Loader) linkServices(graph *iag.Graph) {
	for i, svc := range graph.Services {
		for j, binding := range svc.Bindings {
			if binding.Protocol == "http" && binding.ResourceRef == "" {
				targetEnv := binding.InjectEnv
				routePattern := binding.Interface

				matched := false
				for _, candidate := range graph.Services {
					if candidate.Name == svc.Name {
						continue
					}
					// 1. Route match: candidate service exposes the route
					for _, ing := range candidate.Ingress {
						for _, r := range ing.Routes {
							if routePattern != "" && strings.Contains(r, routePattern) {
								graph.Services[i].Bindings[j].ServiceRef = candidate.Name
								matched = true
								break
							}
						}
						if matched {
							break
						}
					}
					// 2. Env naming convention match (e.g. PAYMENT_SERVICE_URL -> payments)
					if !matched && strings.Contains(strings.ToUpper(targetEnv), strings.ToUpper(candidate.Name)) {
						graph.Services[i].Bindings[j].ServiceRef = candidate.Name
						matched = true
					}
				}

				// If unresolved, emit an actionable diagnostic
				if !matched {
					graph.Diagnostics = append(graph.Diagnostics, iag.Diagnostic{
						Level:      "warn",
						Message:    fmt.Sprintf("Outbound HTTP call in service %q via env %q could not be matched to an internal service", svc.Name, targetEnv),
						Provenance: binding.Provenance,
						Suggestion: "If this targets an external API, declare in anode.toml or verify target service route.",
					})
				}
			}
		}
	}
}
