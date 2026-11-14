package devengine

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"os/exec"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const postgresReadyTimeout = 60 * time.Second

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
		port := m.getContainerPort(ctx, containerName, 5432)
		if port > 0 {
			if err := m.WaitForPostgresReady(ctx, port, resourceID, postgresReadyTimeout); err != nil {
				return 0, fmt.Errorf("postgres container %s failed readiness check: %w", containerName, err)
			}
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
	if err := m.WaitForPostgresReady(ctx, port, resourceID, postgresReadyTimeout); err != nil {
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

// WaitForPostgresReady succeeds only when the target database answers a query. A bare TCP connect is not
// enough: the published port accepts connections while the server is still initializing.
func (m *ContainerManager) WaitForPostgresReady(ctx context.Context, port int, database string, timeout time.Duration) error {
	dsn := fmt.Sprintf("postgres://postgres:postgres@127.0.0.1:%d/%s?sslmode=disable&connect_timeout=2", port, database)
	deadline := time.Now().Add(timeout)
	var lastErr error
	for time.Now().Before(deadline) {
		if err := ctx.Err(); err != nil {
			return err
		}
		db, err := sql.Open("pgx", dsn)
		if err == nil {
			err = db.PingContext(ctx)
			_ = db.Close()
		}
		if err == nil {
			return nil
		}
		lastErr = err
		time.Sleep(250 * time.Millisecond)
	}
	return fmt.Errorf("timed out after %v waiting for database %s on port %d: last error: %v", timeout, database, port, lastErr)
}

func isPortAvailable(port int) bool {
	l, err := net.ListenTCP("tcp", &net.TCPAddr{IP: net.ParseIP("127.0.0.1"), Port: port})
	if err != nil {
		return false
	}
	_ = l.Close()
	return true
}
