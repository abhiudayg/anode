package devengine

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"sync"

	"github.com/abhiudayg/anode/internal/iag"
)

type ServiceInstance struct {
	Name       string
	Port       int
	Cmd        *exec.Cmd
	Env        []string
	CancelFunc context.CancelFunc
}

type Engine struct {
	rootDir   string
	lockfile  *iag.LockFile
	mu        sync.Mutex
	instances map[string]*ServiceInstance
}

func NewEngine(rootDir string, lockfile *iag.LockFile) *Engine {
	return &Engine{
		rootDir:   rootDir,
		lockfile:  lockfile,
		instances: make(map[string]*ServiceInstance),
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

// PlanEnvVariables assigns ports and generates comprehensive connection strings
func (e *Engine) PlanEnvVariables() (map[string]map[string]string, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	envPlan := make(map[string]map[string]string)
	servicePorts := make(map[string]int)

	// Allocate a dynamic port for each service
	for name := range e.lockfile.Services {
		port, err := AllocateFreePort()
		if err != nil {
			return nil, fmt.Errorf("failed to allocate port for service %s: %w", name, err)
		}
		servicePorts[name] = port
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
					dbName := b.ResourceRef
					// PILLAR 1: Check AutoProvision status
					if res.AutoProvision {
						if b.InjectEnv != "" {
							envPlan[name][b.InjectEnv] = fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:5432/%s?sslmode=disable", dbName)
						}
						// Inject decomposed credentials (DB_HOST, DB_PORT, etc.) if requested by code
						for _, exp := range b.ExpandedEnv {
							switch exp {
							case "DB_HOST", "DATABASE_HOST", "POSTGRES_HOST":
								envPlan[name][exp] = "127.0.0.1"
							case "DB_PORT", "DATABASE_PORT", "POSTGRES_PORT":
								envPlan[name][exp] = "5432"
							case "DB_USER", "DATABASE_USER", "POSTGRES_USER":
								envPlan[name][exp] = "postgres"
							case "DB_PASS", "DB_PASSWORD", "DATABASE_PASSWORD":
								envPlan[name][exp] = "postgres"
							case "DB_NAME", "DATABASE_NAME":
								envPlan[name][exp] = dbName
							}
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
				targetPort := servicePorts[b.ServiceRef]
				if targetPort > 0 {
					envPlan[name][b.InjectEnv] = fmt.Sprintf("http://127.0.0.1:%d", targetPort)
				}
			}
		}
	}

	return envPlan, nil
}

// StartService launches a service binary as a child process
func (e *Engine) StartService(ctx context.Context, svc iag.Service, env map[string]string) (*ServiceInstance, error) {
	entryDir := filepath.Join(e.rootDir, svc.Entrypoint)
	binPath := filepath.Join(e.rootDir, ".verify", "output", svc.Name)

	buildCmd := exec.CommandContext(ctx, "go", "build", "-o", binPath, ".")
	buildCmd.Dir = entryDir
	if out, err := buildCmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("build failed for %s: %s (%w)", svc.Name, string(out), err)
	}

	svcCtx, cancel := context.WithCancel(ctx)
	cmd := exec.CommandContext(svcCtx, binPath)
	cmd.Dir = entryDir
	cmd.Env = os.Environ()
	for k, v := range env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("failed to start %s: %w", svc.Name, err)
	}

	inst := &ServiceInstance{
		Name:       svc.Name,
		Cmd:        cmd,
		CancelFunc: cancel,
	}

	e.mu.Lock()
	e.instances[svc.Name] = inst
	e.mu.Unlock()

	return inst, nil
}

func (e *Engine) StopAll() {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, inst := range e.instances {
		if inst.CancelFunc != nil {
			inst.CancelFunc()
		}
	}
}
