package devengine

import (
	"context"
	"fmt"
	"net"
	"os/exec"
	"sync"
	"time"

	"github.com/abhiudayg/anode/internal/iag"
)

type ServiceInstance struct {
	Name       string
	Port       int
	Cmd        *exec.Cmd
	CancelFunc context.CancelFunc
}

type Engine struct {
	rootDir          string
	lockfile         *iag.LockFile
	containerMgr     *ContainerManager
	migrationRunner  *MigrationRunner
	supervisor       *Supervisor
	allocatedPorts   map[string]int
	allocatedDBPorts map[string]int
	mu               sync.Mutex
}

func NewEngine(rootDir string, lockfile *iag.LockFile) *Engine {
	return &Engine{
		rootDir:          rootDir,
		lockfile:         lockfile,
		containerMgr:     NewContainerManager(),
		migrationRunner:  NewMigrationRunner(rootDir),
		supervisor:       NewSupervisor(rootDir, lockfile),
		allocatedPorts:   make(map[string]int),
		allocatedDBPorts: make(map[string]int),
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
				fmt.Printf("  ✓ Applied %d migration(s) for %s\n", applied, resID)
			}
		}
	}
	return nil
}

// PlanEnvVariables assigns ports and generates comprehensive connection strings
func (e *Engine) PlanEnvVariables() (map[string]map[string]string, error) {
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
					dbPort := e.allocatedDBPorts[b.ResourceRef]
					if dbPort == 0 {
						dbPort = 5432
					}
					dbName := b.ResourceRef

					if b.InjectEnv != "" {
						envPlan[name][b.InjectEnv] = fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:%d/%s?sslmode=disable", dbPort, dbName)
					}
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

func (e *Engine) StopAll() {
	e.supervisor.StopAll()
}

func WaitForHealth(ctx context.Context, url string, timeout time.Duration) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return false
		default:
			conn, err := net.DialTimeout("tcp", url, 200*time.Millisecond)
			if err == nil {
				_ = conn.Close()
				return true
			}
			time.Sleep(100 * time.Millisecond)
		}
	}
	return false
}
