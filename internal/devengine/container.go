package devengine

import (
	"context"
	"fmt"
	"net"
	"os/exec"
	"strings"
	"time"
)

type ContainerSpec struct {
	ID            string
	Image         string
	HostPort      int
	ContainerPort int
	Env           map[string]string
}

type ContainerManager struct {
	cliBinary string // "docker" or "podman"
}

func NewContainerManager() *ContainerManager {
	cli := "docker"
	if _, err := exec.LookPath("docker"); err != nil {
		if _, err := exec.LookPath("podman"); err == nil {
			cli = "podman"
		}
	}
	return &ContainerManager{cliBinary: cli}
}

// EnsurePostgres provisions or starts an isolated local Postgres container
func (m *ContainerManager) EnsurePostgres(ctx context.Context, resourceID string, preferredPort int) (int, error) {
	containerName := fmt.Sprintf("anode-%s", resourceID)

	// Check if already running
	if m.isContainerRunning(ctx, containerName) {
		// Discover mapped port
		port := m.getContainerPort(ctx, containerName, 5432)
		if port > 0 {
			return port, nil
		}
	}

	// Allocate a guaranteed collision-free port
	port := preferredPort
	if port == 0 || !isPortAvailable(port) {
		freePort, err := AllocateFreePort()
		if err != nil {
			return 0, fmt.Errorf("failed to allocate free port for %s: %w", resourceID, err)
		}
		port = freePort
	}

	// Remove old stopped container with same name if exists
	_ = exec.CommandContext(ctx, m.cliBinary, "rm", "-f", containerName).Run()

	// Spin up local Postgres
	args := []string{
		"run", "-d",
		"--name", containerName,
		"-p", fmt.Sprintf("127.0.0.1:%d:5432", port),
		"-e", "POSTGRES_USER=postgres",
		"-e", "POSTGRES_PASSWORD=postgres",
		"-e", fmt.Sprintf("POSTGRES_DB=%s", resourceID),
		"postgres:16-alpine",
	}

	cmd := exec.CommandContext(ctx, m.cliBinary, args...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return 0, fmt.Errorf("failed to start postgres container (%s): %s (%w)", m.cliBinary, string(out), err)
	}

	// Wait for readiness
	if err := m.WaitForPostgresReady(ctx, port, 15*time.Second); err != nil {
		return 0, fmt.Errorf("postgres container %s failed readiness check: %w", containerName, err)
	}

	return port, nil
}

func (m *ContainerManager) isContainerRunning(ctx context.Context, name string) bool {
	cmd := exec.CommandContext(ctx, m.cliBinary, "ps", "--filter", fmt.Sprintf("name=^/%s$", name), "--format", "{{.Names}}")
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.TrimSpace(string(out)) == name
}

func (m *ContainerManager) getContainerPort(ctx context.Context, name string, containerPort int) int {
	cmd := exec.CommandContext(ctx, m.cliBinary, "port", name, fmt.Sprintf("%d/tcp", containerPort))
	out, err := cmd.Output()
	if err != nil {
		return 0
	}
	parts := strings.Split(strings.TrimSpace(string(out)), ":")
	if len(parts) >= 2 {
		var p int
		fmt.Sscanf(parts[len(parts)-1], "%d", &p)
		return p
	}
	return 0
}

func (m *ContainerManager) WaitForPostgresReady(ctx context.Context, port int, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", port), 300*time.Millisecond)
			if err == nil {
				_ = conn.Close()
				return nil
			}
			time.Sleep(200 * time.Millisecond)
		}
	}
	return fmt.Errorf("timed out after %v waiting for postgres port %d", timeout, port)
}

func isPortAvailable(port int) bool {
	l, err := net.ListenTCP("tcp", &net.TCPAddr{IP: net.ParseIP("127.0.0.1"), Port: port})
	if err != nil {
		return false
	}
	_ = l.Close()
	return true
}
