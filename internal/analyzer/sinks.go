package analyzer

import (
	"fmt"
	"go/token"
	"os"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
	"golang.org/x/tools/go/ssa"
)

// SinkInspector inspects SSA call instructions for standard library and ecosystem choke points
type SinkInspector struct {
	rootDir string
	fset    *token.FileSet
}

func NewSinkInspector(rootDir string, fset *token.FileSet) *SinkInspector {
	return &SinkInspector{
		rootDir: rootDir,
		fset:    fset,
	}
}

func (s *SinkInspector) FormatPos(pos token.Pos) string {
	if !pos.IsValid() || s.fset == nil {
		return "unknown"
	}
	position := s.fset.Position(pos)
	rel, err := filepath.Rel(s.rootDir, position.Filename)
	if err == nil {
		return fmt.Sprintf("%s:%d", rel, position.Line)
	}
	return fmt.Sprintf("%s:%d", filepath.Base(position.Filename), position.Line)
}

func hasMigrationFiles(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			return true
		}
	}
	return false
}

func (s *SinkInspector) InspectCall(fn *ssa.Function, call *ssa.CallCommon, svc *iag.Service, graph *iag.Graph) {
	callee := call.StaticCallee()
	if callee == nil {
		return
	}

	pkgPath := ""
	if callee.Pkg != nil && callee.Pkg.Pkg != nil {
		pkgPath = callee.Pkg.Pkg.Path()
	}
	name := callee.Name()
	provenance := s.FormatPos(call.Pos())

	// 1. Relational Database Sinks:
	// - database/sql.Open(driver, dsn)
	// - github.com/jackc/pgx/v5/pgxpool.New(ctx, dsn) or pgxpool.Connect
	if (pkgPath == "database/sql" && name == "Open") ||
		(strings.Contains(pkgPath, "pgxpool") && (name == "New" || name == "Connect" || name == "NewWithConfig")) {

		driverStr := "postgres"
		dsnArgIdx := 0
		if pkgPath == "database/sql" && len(call.Args) > 0 {
			driverStr = ResolveConstantString(call.Args[0])
			dsnArgIdx = 1
		} else if len(call.Args) >= 2 {
			dsnArgIdx = 1 // pgxpool.New(ctx, dsn)
		}

		kind := iag.KindPostgres
		if driverStr == "clickhouse" {
			kind = "clickhouse"
		} else if driverStr == "mysql" {
			kind = "mysql"
		} else if driverStr == "mariadb" {
			kind = "mariadb"
		} else if driverStr == "cockroachdb" {
			kind = "cockroachdb"
		} else if driverStr == "timescaledb" {
			kind = "timescaledb"
		} else if driverStr == "scylladb" || driverStr == "scylla" {
			kind = "scylladb"
		} else if driverStr == "sqlite3" || driverStr == "sqlite" {
			kind = "sqlite"
		} else if driverStr != "" {
			kind = iag.ResourceKind(driverStr)
		}

		var envVar string
		var compositeEnvs []string
		if len(call.Args) > dsnArgIdx {
			envVar = TraceToEnvVar(call.Args[dsnArgIdx])
			compositeEnvs = TraceCompositeEnvVars(call.Args[dsnArgIdx])
		}

		// Determine resource identity based on service or env name
		resourceID := "db-" + svc.Name
		if envVar != "" {
			cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSuffix(envVar, "_URL"), "_DSN"))
			cleaned = strings.ReplaceAll(cleaned, "_", "-")
			resourceID = "db-" + cleaned
		}

		if _, exists := graph.Resources[resourceID]; !exists {
			res := iag.Resource{
				Kind:          kind,
				Lifecycle:     iag.LifecycleStatefulRetain,
				AutoProvision: false,
				Provenance:    provenance,
			}

			// Migration detection based on conventional workspace paths with actual SQL files
			migrationDir := filepath.Join(s.rootDir, "migrations", svc.Name)
			if hasMigrationFiles(migrationDir) {
				res.Migrations = &iag.MigrationSpec{
					Tool:      "goose",
					Path:      filepath.Join("migrations", svc.Name),
					Execution: "pre_traffic_job",
				}
				res.AutoProvision = true
			} else {
				// Check for root migrations folder containing sql files
				rootMig := filepath.Join(s.rootDir, "migrations")
				if hasMigrationFiles(rootMig) {
					res.Migrations = &iag.MigrationSpec{
						Tool:      "goose",
						Path:      "migrations",
						Execution: "pre_traffic_job",
					}
					res.AutoProvision = true
				}
			}

			graph.Resources[resourceID] = res
		}

		svc.Bindings = append(svc.Bindings, iag.Binding{
			ResourceRef: resourceID,
			Protocol:    string(kind),
			InjectEnv:   envVar,
			ExpandedEnv: compositeEnvs,
			Provenance:  provenance,
		})
	}

	// 2. Cache / Redis Sinks:
	// - github.com/redis/go-redis/v9.NewClient(opts)
	// - github.com/go-redis/redis/v8.NewClient(opts)
	if strings.Contains(pkgPath, "redis") && name == "NewClient" && len(call.Args) > 0 {
		envVar := TraceStructFieldEnvVar(call.Args[0], "Addr")
		resourceID := "redis-" + svc.Name
		if envVar != "" {
			cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSuffix(envVar, "_ADDR"), "_URL"))
			cleaned = strings.ReplaceAll(cleaned, "_", "-")
			if !strings.HasPrefix(cleaned, "redis-") {
				cleaned = "redis-" + strings.TrimSuffix(cleaned, "-redis")
			}
			resourceID = cleaned
		}

		if _, exists := graph.Resources[resourceID]; !exists {
			kind := iag.KindRedis
			if strings.Contains(strings.ToLower(envVar), "valkey") {
				kind = "valkey"
			} else if strings.Contains(strings.ToLower(envVar), "keydb") {
				kind = "keydb"
			} else if strings.Contains(strings.ToLower(envVar), "dragonfly") {
				kind = "dragonfly"
			}
			graph.Resources[resourceID] = iag.Resource{
				Kind:          kind,
				Lifecycle:     iag.LifecycleStatefulRetain,
				AutoProvision: true,
				Provenance:    provenance,
			}
		}

		svc.Bindings = append(svc.Bindings, iag.Binding{
			ResourceRef: resourceID,
			Protocol:    "redis",
			InjectEnv:   envVar,
			Provenance:  provenance,
		})
	}

	// 3. Network Ingress Sinks:
	// - net/http.ListenAndServe
	// - net.Listen("tcp", addr)
	if (pkgPath == "net/http" && name == "ListenAndServe") || (pkgPath == "net" && name == "Listen") {
		addrVal := call.Args[0]
		if pkgPath == "net" && len(call.Args) >= 2 {
			addrVal = call.Args[1]
		}

		envVar := TraceToEnvVar(addrVal)
		portEnv := "PORT"
		if envVar != "" {
			portEnv = envVar
		}

		found := false
		for i := range svc.Ingress {
			if svc.Ingress[i].Protocol == "http" {
				svc.Ingress[i].PortEnv = portEnv
				found = true
				break
			}
		}
		if !found {
			svc.Ingress = append(svc.Ingress, iag.Ingress{
				Protocol: "http",
				PortEnv:  portEnv,
			})
		}
	}

	// 4. HTTP Routes: net/http.ServeMux or Chi / Gin
	// - ServeMux.HandleFunc(pattern, handler)
	// - chi.Router.Get/Post(pattern, handler)
	isRouterMethod := false
	if name == "HandleFunc" && (strings.Contains(pkgPath, "http") || pkgPath == "") {
		isRouterMethod = true
	} else if (name == "Get" || name == "Post" || name == "Put" || name == "Delete") && (strings.Contains(pkgPath, "chi") || strings.Contains(pkgPath, "gin") || strings.Contains(pkgPath, "mux")) {
		isRouterMethod = true
	}

	if isRouterMethod && len(call.Args) >= 2 {
		routePattern := ResolveConstantString(call.Args[1])
		if routePattern != "" {
			if name != "HandleFunc" {
				routePattern = strings.ToUpper(name) + " " + routePattern
			}
			found := false
			for i := range svc.Ingress {
				if svc.Ingress[i].Protocol == "http" {
					alreadyExists := false
					for _, existing := range svc.Ingress[i].Routes {
						if existing == routePattern {
							alreadyExists = true
							break
						}
					}
					if !alreadyExists {
						svc.Ingress[i].Routes = append(svc.Ingress[i].Routes, routePattern)
					}
					found = true
					break
				}
			}
			if !found {
				svc.Ingress = append(svc.Ingress, iag.Ingress{
					Protocol: "http",
					PortEnv:  "PORT",
					Routes:   []string{routePattern},
				})
			}
		}
	}

	// 5. Outbound Network Egress:
	// - http.NewRequest / http.NewRequestWithContext
	if pkgPath == "net/http" && (name == "NewRequest" || name == "NewRequestWithContext") {
		urlArgIdx := 1
		if name == "NewRequestWithContext" {
			urlArgIdx = 2
		}
		if len(call.Args) > urlArgIdx {
			rawURL := ResolveConstantString(call.Args[urlArgIdx])
			envVar, routeSuffix := TraceURL(call.Args[urlArgIdx])

			// If it's a hardcoded external URL (e.g. https://api.stripe.com/...)
			if rawURL != "" && IsExternalURL(rawURL) {
				exists := false
				for _, r := range graph.EgressRules {
					if r.SourceService == svc.Name && r.TargetHost == rawURL {
						exists = true
						break
					}
				}
				if !exists {
					graph.EgressRules = append(graph.EgressRules, iag.EgressRule{
						SourceService: svc.Name,
						TargetHost:    rawURL,
						Port:          443,
						Protocol:      "https",
						IsExternal:    true,
					})
				}
			} else if envVar != "" {
				exists := false
				for _, b := range svc.Bindings {
					if b.InjectEnv == envVar && b.Interface == routeSuffix {
						exists = true
						break
					}
				}
				if !exists {
					svc.Bindings = append(svc.Bindings, iag.Binding{
						ServiceRef: envVar,
						Protocol:   "http",
						Interface:  routeSuffix,
						InjectEnv:  envVar,
						Provenance: provenance,
					})
				}
			}
		}
	}

	// 6. Inbound Typed gRPC stubs: Register<X>Server
	if strings.HasPrefix(name, "Register") && strings.HasSuffix(name, "Server") && len(call.Args) >= 2 {
		portEnv := "PORT"
		var filteredIngress []iag.Ingress
		for _, ing := range svc.Ingress {
			if ing.Protocol == "http" && len(ing.Routes) == 0 {
				portEnv = ing.PortEnv
			} else {
				filteredIngress = append(filteredIngress, ing)
			}
		}
		svc.Ingress = append(filteredIngress, iag.Ingress{
			Protocol: "grpc",
			PortEnv:  portEnv,
			Service:  name,
		})
	}

	// 7. Outbound Typed gRPC client stubs: New<X>Client
	if strings.HasPrefix(name, "New") && strings.HasSuffix(name, "Client") && name != "NewClient" && !strings.Contains(pkgPath, "redis") {
		serverName := "Register" + strings.TrimPrefix(strings.TrimSuffix(name, "Client"), "New") + "Server"
		envVar := ""
		if len(call.Args) > 0 {
			envVar = TraceToEnvVar(call.Args[0])
		}
		exists := false
		for _, b := range svc.Bindings {
			if b.Protocol == "grpc" && b.Interface == serverName {
				exists = true
				break
			}
		}
		if !exists {
			svc.Bindings = append(svc.Bindings, iag.Binding{
				Protocol:   "grpc",
				Interface:  serverName,
				InjectEnv:  envVar,
				Provenance: provenance,
			})
		}
	}
}

// InspectEnvCall tracks secret usage
func (s *SinkInspector) InspectEnvCall(call *ssa.CallCommon, svc *iag.Service) {
	callee := call.StaticCallee()
	if callee != nil && callee.Pkg != nil && callee.Pkg.Pkg != nil &&
		callee.Pkg.Pkg.Path() == "os" && callee.Name() == "Getenv" && len(call.Args) > 0 {
		envName := ResolveConstantString(call.Args[0])
		if strings.Contains(envName, "SECRET") || strings.Contains(envName, "KEY") || strings.Contains(envName, "TOKEN") {
			svc.Secrets = append(svc.Secrets, iag.SecretRef{
				EnvVar:     envName,
				Provenance: s.FormatPos(call.Pos()),
			})
		}
	}
}
