package compiler

import (
	"fmt"
	"go/constant"
	"go/token"
	"os"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/pkg/iag"
	"golang.org/x/tools/go/callgraph"
	"golang.org/x/tools/go/callgraph/vta"
	"golang.org/x/tools/go/packages"
	"golang.org/x/tools/go/ssa"
	"golang.org/x/tools/go/ssa/ssautil"
)

// Compiler analyzes Go source packages and produces an IAG graph.
type Compiler struct {
	rootDir string
}

func New(rootDir string) *Compiler {
	return &Compiler{rootDir: rootDir}
}

// Compile loads the packages, builds SSA, runs reachability, and extracts topology.
func (c *Compiler) Compile(pattern string) (*iag.Graph, error) {
	cfg := &packages.Config{
		Mode: packages.NeedName | packages.NeedFiles | packages.NeedCompiledGoFiles |
			packages.NeedImports | packages.NeedTypes | packages.NeedTypesSizes |
			packages.NeedSyntax | packages.NeedTypesInfo | packages.NeedDeps,
		Dir: c.rootDir,
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
		Services:      make(map[string]iag.Service),
	}

	// Collect all functions in the program for VTA
	allFuncs := ssautil.AllFunctions(prog)

	// Build Call Graph using VTA
	cg := vta.CallGraph(allFuncs, nil)

	// Find all main packages to analyze
	var mainFns []*ssa.Function
	for _, spkg := range ssaPkgs {
		if spkg != nil && spkg.Pkg.Name() == "main" {
			if mainFn := spkg.Func("main"); mainFn != nil {
				mainFns = append(mainFns, mainFn)
			}
		}
	}

	if len(mainFns) == 0 {
		return nil, fmt.Errorf("no main() packages found to analyze")
	}

	for _, mainFn := range mainFns {
		serviceName := extractServiceName(mainFn)
		pkgDir := extractPackageDir(mainFn)

		svc := iag.Service{
			Name:       serviceName,
			PackageDir: pkgDir,
			Ingress:    []iag.IngressSpec{},
			Bindings:   []iag.BindingSpec{},
			Secrets:    []string{},
		}

		reachable := getReachableFunctions(cg, mainFn)

		// Scan reachable functions for sinks
		c.scanFunctions(reachable, &svc, graph)

		graph.Services[serviceName] = svc
	}

	// Link cross-service topologies (e.g. Order Service -> Payment Service)
	c.linkTopology(graph)

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

func extractPackageDir(mainFn *ssa.Function) string {
	if mainFn.Pos().IsValid() {
		return filepath.Dir(mainFn.Prog.Fset.File(mainFn.Pos()).Name())
	}
	return "."
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

func (c *Compiler) scanFunctions(reachable map[*ssa.Function]bool, svc *iag.Service, graph *iag.Graph) {
	for fn := range reachable {
		for _, b := range fn.Blocks {
			for _, instr := range b.Instrs {
				call, ok := instr.(ssa.CallInstruction)
				if !ok {
					continue
				}
				common := call.Common()
				if common == nil {
					continue
				}

				// Check known sinks
				c.inspectCallSink(fn, common, svc, graph)
			}
		}
	}
}

func (c *Compiler) inspectCallSink(fn *ssa.Function, call *ssa.CallCommon, svc *iag.Service, graph *iag.Graph) {
	callee := call.StaticCallee()
	if callee == nil {
		return
	}

	pkgPath := ""
	if callee.Pkg != nil && callee.Pkg.Pkg != nil {
		pkgPath = callee.Pkg.Pkg.Path()
	}
	name := callee.Name()

	// 1. Sink: database/sql.Open
	if pkgPath == "database/sql" && name == "Open" {
		driverVal := call.Args[0]
		dsnVal := call.Args[1]

		driverStr := resolveConstantString(driverVal)
		envVar := traceToEnvVar(dsnVal)

		if driverStr == "postgres" || driverStr == "pgx" {
			resourceID := "db-" + svc.Name
			if envVar != "" {
				cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSuffix(envVar, "_URL"), "_DSN"))
				cleaned = strings.ReplaceAll(cleaned, "_", "-")
				resourceID = "db-" + cleaned
			}

			// Add Resource to graph
			if _, exists := graph.Resources[resourceID]; !exists {
				res := iag.Resource{
					Kind:          iag.KindPostgres,
					EngineVersion: "16",
					Lifecycle:     iag.LifecycleStatefulRetain,
				}
				// Detect migrations if present
				migrationPath := filepath.Join(c.rootDir, "migrations", svc.Name)
				if stat, err := os.Stat(migrationPath); err == nil && stat.IsDir() {
					res.Migrations = &iag.MigrationSpec{
						Tool:      "goose",
						Path:      filepath.Join("migrations", svc.Name),
						Execution: "pre_traffic_job",
					}
				}
				graph.Resources[resourceID] = res
			}

			// Add Service Binding
			svc.Bindings = append(svc.Bindings, iag.BindingSpec{
				TargetKind: "resource",
				TargetRef:  resourceID,
				Protocol:   "tcp",
				InjectEnv:  envVar,
			})
		}
	}

	// 2. Sink: http.ListenAndServe
	if pkgPath == "net/http" && name == "ListenAndServe" {
		addrVal := call.Args[0]
		envVar := traceToEnvVar(addrVal)
		portEnv := "PORT"
		if envVar != "" {
			portEnv = envVar
		}

		svc.Ingress = append(svc.Ingress, iag.IngressSpec{
			Protocol: "http",
			PortEnv:  portEnv,
		})
	}

	// 3. Sink: http.ServeMux.HandleFunc (extracting route definitions)
	if name == "HandleFunc" && len(call.Args) >= 2 {
		routePattern := resolveConstantString(call.Args[1])
		if routePattern != "" {
			if len(svc.Ingress) == 0 {
				svc.Ingress = append(svc.Ingress, iag.IngressSpec{
					Protocol: "http",
					PortEnv:  "PORT",
				})
			}
			for i := range svc.Ingress {
				if svc.Ingress[i].Protocol == "http" {
					svc.Ingress[i].Routes = append(svc.Ingress[i].Routes, routePattern)
				}
			}
		}
	}

	// 4. Sink: Outbound HTTP call via http.NewRequest / http.NewRequestWithContext
	if pkgPath == "net/http" && (name == "NewRequest" || name == "NewRequestWithContext") {
		urlArgIdx := 1
		if name == "NewRequestWithContext" {
			urlArgIdx = 2
		}
		if len(call.Args) > urlArgIdx {
			urlVal := call.Args[urlArgIdx]
			envVar, routeSuffix := traceURL(urlVal)
			if envVar != "" {
				svc.Bindings = append(svc.Bindings, iag.BindingSpec{
					TargetKind: "service",
					TargetRef:  envVar,
					Protocol:   "http",
					Interface:  routeSuffix,
					InjectEnv:  envVar,
				})
			}
		}
	}
}

// traceURL inspects binary string concatenations or direct env variables
func traceURL(val ssa.Value) (envVar string, routeSuffix string) {
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		envVar = traceToEnvVar(binOp.X)
		routeSuffix = resolveConstantString(binOp.Y)
		return envVar, routeSuffix
	}
	envVar = traceToEnvVar(val)
	return envVar, ""
}

// traceToEnvVar traces an SSA value backwards to an os.Getenv("VAR") call or struct field
func traceToEnvVar(val ssa.Value) string {
	if val == nil {
		return ""
	}

	// 1. Direct call to os.Getenv("FOO")
	if call, ok := val.(*ssa.Call); ok {
		if callee := call.Common().StaticCallee(); callee != nil {
			if callee.Pkg != nil && callee.Pkg.Pkg != nil && callee.Pkg.Pkg.Path() == "os" && callee.Name() == "Getenv" {
				return resolveConstantString(call.Common().Args[0])
			}
		}
	}

	// 2. Struct field access: cfg.DatabaseURL
	// In Go SSA:
	// t0 = loadConfig()
	// t1 = &t0.DatabaseURL [#1]
	// t2 = *t1 (t2 is ssa.UnOp MUL)
	if unOp, ok := val.(*ssa.UnOp); ok && unOp.Op == token.MUL {
		if fieldAddr, ok := unOp.X.(*ssa.FieldAddr); ok {
			return traceFieldAddrSource(fieldAddr)
		}
	}

	// 3. String concatenation (e.g. ":" + cfg.Port)
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		left := traceToEnvVar(binOp.X)
		if left != "" {
			return left
		}
		return traceToEnvVar(binOp.Y)
	}

	// 4. Phi nodes
	if phi, ok := val.(*ssa.Phi); ok {
		for _, edge := range phi.Edges {
			if env := traceToEnvVar(edge); env != "" {
				return env
			}
		}
	}

	return ""
}

// traceFieldAddrSource traces backward from a FieldAddr through its parent struct constructor
func traceFieldAddrSource(fieldAddr *ssa.FieldAddr) string {
	structVal := fieldAddr.X
	fieldIdx := fieldAddr.Field

	// If structVal came from a function call (e.g. loadConfig())
	if call, ok := structVal.(*ssa.Call); ok {
		callee := call.Common().StaticCallee()
		if callee != nil {
			// Find return instruction of callee
			for _, b := range callee.Blocks {
				for _, instr := range b.Instrs {
					if ret, ok := instr.(*ssa.Return); ok && len(ret.Results) > 0 {
						retVal := ret.Results[0]
						// In Go SSA, returning &Config{...} is an Alloc
						if alloc, ok := retVal.(*ssa.Alloc); ok {
							return findStoreToField(alloc, fieldIdx)
						}
					}
				}
			}
		}
	}

	// If structVal is a local Alloc in the same function
	if alloc, ok := structVal.(*ssa.Alloc); ok {
		return findStoreToField(alloc, fieldIdx)
	}

	return ""
}

func findStoreToField(alloc *ssa.Alloc, fieldIdx int) string {
	if alloc.Referrers() == nil {
		return ""
	}
	for _, ref := range *alloc.Referrers() {
		if fa, ok := ref.(*ssa.FieldAddr); ok && fa.Field == fieldIdx {
			if fa.Referrers() != nil {
				for _, subRef := range *fa.Referrers() {
					if store, ok := subRef.(*ssa.Store); ok && store.Addr == fa {
						return traceToEnvVar(store.Val)
					}
				}
			}
		}
	}
	return ""
}

func resolveConstantString(val ssa.Value) string {
	if c, ok := val.(*ssa.Const); ok && c.Value != nil && c.Value.Kind() == constant.String {
		return constant.StringVal(c.Value)
	}
	return ""
}

// linkTopology resolves service-to-service bindings using routes and env vars
func (c *Compiler) linkTopology(graph *iag.Graph) {
	for svcName, svc := range graph.Services {
		for i, binding := range svc.Bindings {
			if binding.TargetKind == "service" {
				targetEnv := binding.InjectEnv
				routePattern := binding.Interface

				matchedService := ""
				for candidateName, candidateSvc := range graph.Services {
					if candidateName == svcName {
						continue
					}
					// Route matching: does candidate expose routePattern?
					for _, ingress := range candidateSvc.Ingress {
						for _, r := range ingress.Routes {
							if routePattern != "" && strings.Contains(r, routePattern) {
								matchedService = candidateName
								break
							}
						}
					}
					// Fallback: Env naming convention
					if matchedService == "" && strings.Contains(strings.ToUpper(targetEnv), strings.ToUpper(candidateName)) {
						matchedService = candidateName
					}
				}

				if matchedService != "" {
					svc.Bindings[i].TargetRef = matchedService
					graph.Policies = append(graph.Policies, iag.NetworkPolicy{
						SourceService: svcName,
						Target:        matchedService,
						AllowTraffic:  true,
					})
				}
			} else if binding.TargetKind == "resource" {
				graph.Policies = append(graph.Policies, iag.NetworkPolicy{
					SourceService: svcName,
					Target:        binding.TargetRef,
					AllowTraffic:  true,
				})
			}
		}
		graph.Services[svcName] = svc
	}
}
