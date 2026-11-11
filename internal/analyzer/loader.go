package analyzer

import (
	"fmt"
	"go/types"
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
	abs, err := filepath.Abs(rootDir)
	if err == nil {
		rootDir = abs
	}
	return &Loader{rootDir: rootDir}
}

// LoadAndAnalyze loads Go packages, builds SSA, runs reachability, and extracts the IAG
func (l *Loader) LoadAndAnalyze(pattern string) (*iag.LockFile, error) {
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

	prog, ssaPkgs := ssautil.AllPackages(pkgs, ssa.InstantiateGenerics)
	prog.Build()

	lockfile := &iag.LockFile{
		SchemaVersion: iag.V1,
		Resources:     make(map[string]iag.Resource),
		Services:      make(map[string]iag.Service),
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
							inspector.InspectCall(fn, common, &svc, lockfile)
							inspector.InspectEnvCall(common, &svc)
						}
					}
				}
			}
		}

		lockfile.Services[serviceName] = svc
	}

	// Link cross-service topologies and typed contracts (PILLAR 2)
	l.linkServices(lockfile)

	return lockfile, nil
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
		absRoot, _ := filepath.Abs(rootDir)
		absDir, _ := filepath.Abs(dir)
		rel, err := filepath.Rel(absRoot, absDir)
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

	validPkgs := make(map[*types.Package]bool)
	if root.Pkg != nil && root.Pkg.Pkg != nil {
		var visit func(p *types.Package)
		visit = func(p *types.Package) {
			if p == nil || validPkgs[p] {
				return
			}
			validPkgs[p] = true
			for _, imp := range p.Imports() {
				visit(imp)
			}
		}
		visit(root.Pkg.Pkg)
	}

	var queue []*callgraph.Node
	if node != nil {
		queue = append(queue, node)
	}
	reachable[root] = true

	// Also seed all anonymous closures defined within the function hierarchy (e.g. HTTP route handlers)
	var seedAnon func(fn *ssa.Function)
	seedAnon = func(fn *ssa.Function) {
		for _, anon := range fn.AnonFuncs {
			if !reachable[anon] {
				reachable[anon] = true
				if anonNode := cg.Nodes[anon]; anonNode != nil {
					queue = append(queue, anonNode)
				}
				seedAnon(anon)
			}
		}
	}
	seedAnon(root)

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		for _, edge := range curr.Out {
			callee := edge.Callee.Func
			if callee != nil && !reachable[callee] {
				if len(validPkgs) > 0 && callee.Pkg != nil && callee.Pkg.Pkg != nil {
					if !validPkgs[callee.Pkg.Pkg] {
						continue
					}
				}
				reachable[callee] = true
				if edge.Callee != nil {
					queue = append(queue, edge.Callee)
				}
			}
		}
	}
	return reachable
}

// =========================================================================
// PILLAR 2: Cross-Service Contract Linker (Typed gRPC Stubs & Route Tables)
// =========================================================================
func (l *Loader) linkServices(graph *iag.LockFile) {
	for svcName, svc := range graph.Services {
		for j, binding := range svc.Bindings {
			// 1. Typed gRPC Contract Matching
			if binding.Protocol == "grpc" {
				protoInterface := binding.Interface
				matched := false
				for candidateName, candidate := range graph.Services {
					if candidateName == svcName {
						continue
					}
					for _, ing := range candidate.Ingress {
						if ing.Protocol == "grpc" && (ing.Service == protoInterface || strings.HasSuffix(protoInterface, ing.Service)) {
							svc.Bindings[j].ServiceRef = candidateName
							matched = true
							break
						}
					}
					if matched {
						break
					}
				}

				if !matched {
					graph.Diagnostics = append(graph.Diagnostics, iag.Diagnostic{
						Level:      "warn",
						Message:    fmt.Sprintf("gRPC client for %q in service %q has no matching server registration in this workspace", protoInterface, svcName),
						Provenance: binding.Provenance,
						Suggestion: "Verify that the target service registers this gRPC server interface or declare an external host in anode.toml",
					})
				}
			}

			// 2. HTTP Route Contract Matching
			if binding.Protocol == "http" && binding.ResourceRef == "" {
				targetEnv := binding.InjectEnv
				routePattern := binding.Interface

				matched := false
				for candidateName, candidate := range graph.Services {
					if candidateName == svcName {
						continue
					}
					// Route matching
					for _, ing := range candidate.Ingress {
						for _, r := range ing.Routes {
							if routePattern != "" && strings.Contains(r, routePattern) {
								svc.Bindings[j].ServiceRef = candidateName
								matched = true
								break
							}
						}
						if matched {
							break
						}
					}
					// Fallback: Env naming convention match (e.g. PAYMENT_SERVICE_URL -> payments)
					if !matched && targetEnv != "" && strings.Contains(strings.ToUpper(targetEnv), strings.ToUpper(candidateName)) {
						svc.Bindings[j].ServiceRef = candidateName
						matched = true
					}
				}

				// PILLAR 4 Diagnostic: Actionable warning when unmatched
				if !matched {
					graph.Diagnostics = append(graph.Diagnostics, iag.Diagnostic{
						Level:      "warn",
						Message:    fmt.Sprintf("Outbound HTTP call in service %q via env %q could not be matched to an internal service", svcName, targetEnv),
						Provenance: binding.Provenance,
						Suggestion: "If this targets an external third-party API, declare in anode.toml or verify route matching.",
					})
				}
			}
		}
		graph.Services[svcName] = svc
	}
}
