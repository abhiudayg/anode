package devengine

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

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
	graph     *iag.Graph
	mu        sync.Mutex
	instances map[string]*ServiceInstance
}

func NewEngine(rootDir string, graph *iag.Graph) *Engine {
	return &Engine{
		rootDir:   rootDir,
		graph:     graph,
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

// PlanEnvVariables assigns ports and generates connection strings
func (e *Engine) PlanEnvVariables() (map[string]map[string]string, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	envPlan := make(map[string]map[string]string)
	servicePorts := make(map[string]int)

	// Allocate a dynamic port for each service
	for _, svc := range e.graph.Services {
		port, err := AllocateFreePort()
		if err != nil {
			return nil, fmt.Errorf("failed to allocate port for service %s: %w", svc.Name, err)
		}
		servicePorts[svc.Name] = port
		envPlan[svc.Name] = map[string]string{
			"PORT": fmt.Sprintf("%d", port),
		}
	}

	// Resolve Bindings
	for _, svc := range e.graph.Services {
		for _, b := range svc.Bindings {
			if b.ResourceRef != "" && b.InjectEnv != "" {
				// Map local postgres port or standard connection string
				envPlan[svc.Name][b.InjectEnv] = fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:5432/%s?sslmode=disable", b.ResourceRef)
			}
			if b.ServiceRef != "" && b.InjectEnv != "" {
				targetPort := servicePorts[b.ServiceRef]
				if targetPort > 0 {
					envPlan[svc.Name][b.InjectEnv] = fmt.Sprintf("http://127.0.0.1:%d", targetPort)
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

// WaitForHealth polls an HTTP endpoint until ready or timeout
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
