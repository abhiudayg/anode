package devengine

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sync"

	"github.com/abhiudayg/anode/internal/iag"
)

// ANSI Color codes for multiplexed log streaming
var serviceColors = []string{
	"\033[36m", // Cyan
	"\033[32m", // Green
	"\033[33m", // Yellow
	"\033[35m", // Magenta
	"\033[34m", // Blue
}

const colorReset = "\033[0m"

type Supervisor struct {
	rootDir   string
	lockfile  *iag.LockFile
	instances map[string]*ServiceInstance
	mu        sync.Mutex
	colorIdx  int
}

func NewSupervisor(rootDir string, lockfile *iag.LockFile) *Supervisor {
	return &Supervisor{
		rootDir:   rootDir,
		lockfile:  lockfile,
		instances: make(map[string]*ServiceInstance),
	}
}

// StartService builds and boots a single microservice with styled streaming logs
func (s *Supervisor) StartService(ctx context.Context, svc iag.Service, env map[string]string) error {
	s.mu.Lock()
	color := serviceColors[s.colorIdx%len(serviceColors)]
	s.colorIdx++
	s.mu.Unlock()

	entryDir := filepath.Join(s.rootDir, svc.Entrypoint)
	binDir := filepath.Join(s.rootDir, ".verify", "output")
	_ = os.MkdirAll(binDir, 0755)
	binPath := filepath.Join(binDir, svc.Name)

	// Incremental Go Build
	buildCmd := exec.CommandContext(ctx, "go", "build", "-o", binPath, ".")
	buildCmd.Dir = entryDir
	if out, err := buildCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("build failed for %s: %s (%w)", svc.Name, string(out), err)
	}

	svcCtx, cancel := context.WithCancel(ctx)
	cmd := exec.CommandContext(svcCtx, binPath)
	cmd.Dir = entryDir
	cmd.Env = os.Environ()
	for k, v := range env {
		cmd.Env = append(cmd.Env, fmt.Sprintf("%s=%s", k, v))
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return err
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		cancel()
		return err
	}

	if err := cmd.Start(); err != nil {
		cancel()
		return fmt.Errorf("failed to start %s: %w", svc.Name, err)
	}

	go s.streamLogs(stdout, svc.Name, color)
	go s.streamLogs(stderr, svc.Name, color)

	inst := &ServiceInstance{
		Name:       svc.Name,
		Cmd:        cmd,
		CancelFunc: cancel,
	}

	s.mu.Lock()
	s.instances[svc.Name] = inst
	s.mu.Unlock()

	return nil
}

func (s *Supervisor) streamLogs(r io.Reader, serviceName string, color string) {
	scanner := bufio.NewScanner(r)
	prefix := fmt.Sprintf("%s[%s]%s ", color, serviceName, colorReset)
	for scanner.Scan() {
		fmt.Printf("%s%s\n", prefix, scanner.Text())
	}
}

func (s *Supervisor) StopAll() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, inst := range s.instances {
		if inst.CancelFunc != nil {
			inst.CancelFunc()
		}
	}
}

func (s *Supervisor) RestartService(ctx context.Context, name string, env map[string]string) error {
	s.mu.Lock()
	inst, exists := s.instances[name]
	svc := s.lockfile.Services[name]
	s.mu.Unlock()

	if exists && inst.CancelFunc != nil {
		inst.CancelFunc()
		_ = inst.Cmd.Wait()
	}

	return s.StartService(ctx, svc, env)
}
