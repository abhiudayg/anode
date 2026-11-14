package deployer_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/analyzer"
	"github.com/abhiudayg/anode/internal/deployer"
)

type fakeHost struct {
	commands []string
	uploads  map[string][]byte
	failOn   string
}

func newFakeHost() *fakeHost {
	return &fakeHost{uploads: make(map[string][]byte)}
}

func (h *fakeHost) Run(cmd string) (string, error) {
	h.commands = append(h.commands, cmd)
	if h.failOn != "" && strings.Contains(cmd, h.failOn) {
		return "", os.ErrPermission
	}
	if strings.Contains(cmd, "echo '---'") {
		return "---\n", nil
	}
	return "", nil
}

func (h *fakeHost) StreamBytes(data []byte, dstPath string, _ os.FileMode) error {
	h.uploads[dstPath] = append([]byte(nil), data...)
	return nil
}

func (h *fakeHost) StreamFile(srcPath string, dstPath string, _ os.FileMode) error {
	data, err := os.ReadFile(srcPath)
	if err != nil {
		return err
	}
	h.uploads[dstPath] = data
	return nil
}

func (h *fakeHost) ran(fragment string) bool {
	for _, cmd := range h.commands {
		if strings.Contains(cmd, fragment) {
			return true
		}
	}
	return false
}

func fixtureProject(t *testing.T) (string, string) {
	t.Helper()
	src, err := filepath.Abs("../analyzer/testdata/configdsn")
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	for _, name := range []string{"main.go", "go.mod", "config.json"} {
		data, err := os.ReadFile(filepath.Join(src, name))
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, name), data, 0o644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte("DATABASE_DSN=postgres://app@db.example.internal/app\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	return dir, src
}

func TestDeployCompletesAgainstFakeHost(t *testing.T) {
	dir, _ := fixtureProject(t)
	lock, err := analyzer.NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("analysis failed: %v", err)
	}

	host := newFakeHost()
	coordinator := deployer.NewDeployCoordinator(dir, host, lock)
	if err := coordinator.Deploy(context.Background(), "app.example.test"); err != nil {
		t.Fatalf("deploy failed against a healthy host: %v", err)
	}

	for _, fragment := range []string{"caddy validate", "systemctl daemon-reload", "is-active", "mkdir -p -m 700 /etc/anode/env"} {
		if !host.ran(fragment) {
			t.Errorf("expected the deploy to run a command containing %q", fragment)
		}
	}
	var binary, unit bool
	for dst := range host.uploads {
		if strings.HasPrefix(dst, "/var/lib/anode/releases/") && !strings.HasSuffix(dst, ".service") && !strings.HasSuffix(dst, ".json") && !strings.HasSuffix(dst, "ports") {
			binary = true
		}
		if strings.HasPrefix(dst, "/etc/anode/env/") && strings.HasSuffix(dst, ".config.json") {
			unit = true
		}
	}
	if !binary {
		t.Errorf("expected the release binary to be uploaded, uploads: %v", keys(host.uploads))
	}
	if !unit {
		t.Errorf("expected the config file to be staged for the handoff, uploads: %v", keys(host.uploads))
	}
}

func TestDeployStopsWhenServiceDoesNotStart(t *testing.T) {
	dir, _ := fixtureProject(t)
	lock, err := analyzer.NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("analysis failed: %v", err)
	}

	host := newFakeHost()
	host.failOn = "is-active"
	coordinator := deployer.NewDeployCoordinator(dir, host, lock)
	err = coordinator.Deploy(context.Background(), "app.example.test")
	if err == nil || !strings.Contains(err.Error(), "not running") {
		t.Fatalf("expected a not-running failure, got %v", err)
	}
}

func TestDeployRefusesMissingDatabaseValueBeforeTouchingHost(t *testing.T) {
	dir, _ := fixtureProject(t)
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte("OTHER=1\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	lock, err := analyzer.NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("analysis failed: %v", err)
	}

	host := newFakeHost()
	coordinator := deployer.NewDeployCoordinator(dir, host, lock)
	if err := coordinator.Deploy(context.Background(), "app.example.test"); err == nil {
		t.Fatalf("expected the deploy to stop for a missing .env value")
	}
	if len(host.commands) != 0 || len(host.uploads) != 0 {
		t.Errorf("a refused deploy must not change the host, commands: %d uploads: %d", len(host.commands), len(host.uploads))
	}
}

func keys(m map[string][]byte) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
