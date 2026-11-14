package devengine

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/iag"
)

type ServiceInstance struct {
	Name       string
	Port       int
	Cmd        *exec.Cmd
	CancelFunc context.CancelFunc
}

type Engine struct {
	rootDir           string
	lockfile          *iag.LockFile
	containerMgr      *ContainerManager
	migrationRunner   *MigrationRunner
	supervisor        *Supervisor
	allocatedPorts    map[string]int
	allocatedDBPorts  map[string]int
	migrationsApplied map[string]int
	mu                sync.Mutex
}

func NewEngine(rootDir string, lockfile *iag.LockFile) *Engine {
	return &Engine{
		rootDir:           rootDir,
		lockfile:          lockfile,
		containerMgr:      NewContainerManager(),
		migrationRunner:   NewMigrationRunner(rootDir),
		supervisor:        NewSupervisor(rootDir, lockfile),
		allocatedPorts:    make(map[string]int),
		allocatedDBPorts:  make(map[string]int),
		migrationsApplied: make(map[string]int),
	}
}

// AllocateFreePort finds an unused ephemeral TCP port on localhost
func AllocateFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

// PrepareInfrastructure provisions required local Postgres/Redis containers and runs migrations
func (e *Engine) PrepareInfrastructure(ctx context.Context) error {
	for resID, res := range e.lockfile.Resources {
		if res.AutoProvision && res.Kind == iag.KindPostgres {
			fmt.Printf("📦 Provisioning isolated local Postgres for %s...\n", resID)
			port, err := e.containerMgr.EnsurePostgres(ctx, resID, 5432)
			if err != nil {
				return fmt.Errorf("failed to provision database container for %s: %w", resID, err)
			}
			e.allocatedDBPorts[resID] = port
			fmt.Printf("  ✓ Postgres %s ready on 127.0.0.1:%d\n", resID, port)

			// Run migrations if present
			if res.Migrations != nil && res.Migrations.Path != "" {
				dsn := fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:%d/%s?sslmode=disable", port, resID)
				fmt.Printf("  ⚙ Running migrations from %s...\n", res.Migrations.Path)
				applied, err := e.migrationRunner.RunGooseMigrations(dsn, res.Migrations.Path)
				if err != nil {
					return fmt.Errorf("migration failed for %s: %w", resID, err)
				}
				e.migrationsApplied[resID] = applied
				fmt.Printf("  ✓ Applied %d migration(s) for %s\n", applied, resID)
			}
		}
	}
	return nil
}

// PlanEnvVariables assigns ports and generates comprehensive connection strings
func (e *Engine) PlanEnvVariables() (map[string]map[string]string, error) {
	dotEnv, err := deployer.ReadDotEnv(filepath.Join(e.rootDir, ".env"))
	if err != nil {
		return nil, err
	}
	e.mu.Lock()
	defer e.mu.Unlock()

	envPlan := make(map[string]map[string]string)

	// Allocate a dynamic port for each service
	for name := range e.lockfile.Services {
		port, err := AllocateFreePort()
		if err != nil {
			return nil, fmt.Errorf("failed to allocate port for service %s: %w", name, err)
		}
		e.allocatedPorts[name] = port
		envPlan[name] = map[string]string{
			"PORT": fmt.Sprintf("%d", port),
		}
	}

	// Resolve Bindings & inject both composite and unified env vars
	for name, svc := range e.lockfile.Services {
		for _, b := range svc.Bindings {
			if b.ResourceRef != "" {
				res := e.lockfile.Resources[b.ResourceRef]
				if res.Kind == iag.KindPostgres {
					key := deployer.BindingEnvKey(svc.Name, b)
					dbPort := e.allocatedDBPorts[b.ResourceRef]
					if dbPort == 0 {
						value := dotEnv[key]
						if value == "" {
							return nil, fmt.Errorf("%s is missing from .env (the connection string for %s)", key, b.ResourceRef)
						}
						envPlan[name][key] = value
						continue
					}
					dbName := b.ResourceRef
					envPlan[name][key] = fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:%d/%s?sslmode=disable", dbPort, dbName)
					for _, exp := range b.ExpandedEnv {
						switch exp {
						case "DB_HOST", "DATABASE_HOST", "POSTGRES_HOST":
							envPlan[name][exp] = "127.0.0.1"
						case "DB_PORT", "DATABASE_PORT", "POSTGRES_PORT":
							envPlan[name][exp] = fmt.Sprintf("%d", dbPort)
						case "DB_USER", "DATABASE_USER", "POSTGRES_USER":
							envPlan[name][exp] = "postgres"
						case "DB_PASS", "DB_PASSWORD", "DATABASE_PASSWORD":
							envPlan[name][exp] = "postgres"
						case "DB_NAME", "DATABASE_NAME":
							envPlan[name][exp] = dbName
						}
					}
				} else if res.Kind == iag.KindRedis {
					if b.InjectEnv != "" {
						envPlan[name][b.InjectEnv] = "127.0.0.1:6379"
					}
				}
			}

			// Service-to-service internal resolution
			if b.ServiceRef != "" && b.InjectEnv != "" {
				targetPort := e.allocatedPorts[b.ServiceRef]
				if targetPort > 0 {
					envPlan[name][b.InjectEnv] = fmt.Sprintf("http://127.0.0.1:%d", targetPort)
				}
			}
		}
	}

	return envPlan, nil
}

// StartAll launches all microservices under supervisor management
func (e *Engine) StartAll(ctx context.Context, envPlan map[string]map[string]string) error {
	for name, svc := range e.lockfile.Services {
		env := envPlan[name]
		if err := e.supervisor.StartService(ctx, svc, env); err != nil {
			return err
		}
	}
	return nil
}

// StopAll stops the services and removes the database containers this run started. They have no volumes, so
// nothing is lost, and the next run starts from a clean database.
func (e *Engine) StopAll() {
	e.supervisor.StopAll()
	for resID := range e.allocatedDBPorts {
		e.containerMgr.Remove(context.Background(), containerName(resID))
	}
}

// WaitForServices waits until every service with an HTTP ingress answers on its port.
func (e *Engine) WaitForServices(ctx context.Context, timeout time.Duration) error {
	var notReady []string
	for name, svc := range e.lockfile.Services {
		if !hasHTTPIngress(svc) {
			continue
		}
		port := e.allocatedPorts[name]
		if !WaitForHealth(ctx, fmt.Sprintf("http://127.0.0.1:%d%s", port, healthPath), timeout) {
			notReady = append(notReady, fmt.Sprintf("%s (port %d)", name, port))
		}
	}
	if len(notReady) > 0 {
		sort.Strings(notReady)
		return fmt.Errorf("services did not pass GET %s within %v: %s", healthPath, timeout, strings.Join(notReady, ", "))
	}
	return nil
}

func hasHTTPIngress(svc iag.Service) bool {
	for _, ing := range svc.Ingress {
		if ing.Protocol == "http" {
			return true
		}
	}
	return false
}

// healthPath is the route every HTTP service must serve, with a status below 400, before dev reports it up.
const healthPath = "/healthz"

// WaitForHealth reports whether GET url returns a status below 400 within timeout. A refused, reset, or dropped
// connection, and an error status such as 404 or 500, are not ready.
func WaitForHealth(ctx context.Context, url string, timeout time.Duration) bool {
	client := &http.Client{Timeout: time.Second, CheckRedirect: func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	}}
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return false
		default:
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
			if err != nil {
				return false
			}
			resp, err := client.Do(req)
			if err == nil {
				_ = resp.Body.Close()
				if resp.StatusCode < http.StatusBadRequest {
					return true
				}
			}
			time.Sleep(200 * time.Millisecond)
		}
	}
	return false
}
