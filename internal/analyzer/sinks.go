package analyzer

import (
	"fmt"
	"go/token"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
	"golang.org/x/tools/go/ssa"
)

// SinkInspector inspects call instructions and extracts resources, ingress, bindings, and secrets
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

	// 1. Sink: database/sql.Open
	if pkgPath == "database/sql" && name == "Open" && len(call.Args) >= 2 {
		driverStr := ResolveConstantString(call.Args[0])
		envVar := TraceToEnvVar(call.Args[1])

		if driverStr == "postgres" || driverStr == "pgx" {
			resourceID := "db-" + svc.Name
			if envVar != "" {
				cleaned := strings.ToLower(strings.TrimSuffix(strings.TrimSuffix(envVar, "_URL"), "_DSN"))
				cleaned = strings.ReplaceAll(cleaned, "_", "-")
				resourceID = "db-" + cleaned
			}

			if _, exists := graph.Resources[resourceID]; !exists {
				graph.Resources[resourceID] = iag.Resource{
					Kind:       "postgres",
					Lifecycle:  "stateful_retain",
					Provenance: provenance,
				}
			}

			svc.Bindings = append(svc.Bindings, iag.Binding{
				ResourceRef: resourceID,
				Protocol:    "postgres",
				InjectEnv:   envVar,
				Provenance:  provenance,
			})
		}
	}

	// 2. Sink: http.ListenAndServe
	if pkgPath == "net/http" && name == "ListenAndServe" && len(call.Args) >= 1 {
		envVar := TraceToEnvVar(call.Args[0])
		portEnv := "PORT"
		if envVar != "" {
			portEnv = envVar
		}

		// Ensure we don't duplicate existing http ingress
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

	// 3. Sink: http.ServeMux.HandleFunc (extracting route definitions)
	if name == "HandleFunc" && len(call.Args) >= 2 {
		routePattern := ResolveConstantString(call.Args[1])
		if routePattern != "" {
			// Find or create http ingress
			found := false
			for i := range svc.Ingress {
				if svc.Ingress[i].Protocol == "http" {
					svc.Ingress[i].Routes = append(svc.Ingress[i].Routes, routePattern)
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

	// 4. Sink: Outbound HTTP call via http.NewRequest / http.NewRequestWithContext
	if pkgPath == "net/http" && (name == "NewRequest" || name == "NewRequestWithContext") {
		urlArgIdx := 1
		if name == "NewRequestWithContext" {
			urlArgIdx = 2
		}
		if len(call.Args) > urlArgIdx {
			envVar, routeSuffix := TraceURL(call.Args[urlArgIdx])
			if envVar != "" {
				svc.Bindings = append(svc.Bindings, iag.Binding{
					ServiceRef: envVar, // Temporarily holds envVar until linker resolves target
					Protocol:   "http",
					InjectEnv:  envVar,
					Provenance: provenance,
				})
				_ = routeSuffix
			}
		}
	}
}

// InspectEnvCall detects secret reads
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
