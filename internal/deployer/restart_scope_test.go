package deployer_test

import (
	"context"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/analyzer"
	"github.com/abhiudayg/anode/internal/deployer"
)

// stateHost keeps the files a deploy writes, so a second deploy can read the
// fingerprints and units the first one left behind.
type stateHost struct {
	files    map[string]string
	restarts []string
	uploads  []string
}

var execStartRe = regexp.MustCompile(`(?m)^ExecStart=(\S+)`)

func newStateHost() *stateHost {
	return &stateHost{files: make(map[string]string)}
}

func (h *stateHost) Run(cmd string) (string, error) {
	switch {
	case strings.Contains(cmd, "ss -ltnH"):
		// Host port state: the saved port registry, then the (empty) listener list.
		return h.files[between(cmd, "cat ", " 2>/dev/null")] + "---\n", nil
	case strings.HasPrefix(cmd, "cat '/var/lib/anode/state/"):
		path := strings.TrimSuffix(strings.TrimPrefix(cmd, "cat '"), "' 2>/dev/null || true")
		return h.files[path], nil
	case strings.HasPrefix(cmd, "systemctl is-active --quiet 'anode-"):
		return "", nil
	case strings.HasPrefix(cmd, "grep -m1 '^ExecStart="):
		unit := between(cmd, "'/etc/systemd/system/", "'")
		m := execStartRe.FindStringSubmatch(h.files["/etc/systemd/system/"+unit])
		if m == nil {
			return "", nil
		}
		return m[1] + "\n", nil
	case strings.Contains(cmd, "systemctl restart 'anode-"):
		h.restarts = append(h.restarts, between(cmd, "systemctl restart 'anode-", ".service'"))
	}
	return "", nil
}

func (h *stateHost) StreamBytes(data []byte, dst string, _ os.FileMode) error {
	h.files[dst] = string(data)
	return nil
}

func (h *stateHost) StreamFile(src, dst string, _ os.FileMode) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	h.files[dst] = string(data)
	h.uploads = append(h.uploads, dst)
	return nil
}

func copyTree(t *testing.T, src, dst string) {
	t.Helper()
	err := filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, data, 0o644)
	})
	if err != nil {
		t.Fatal(err)
	}
}

// TestDeployRestartsOnlyServicesWhoseInputsChanged deploys the sample shop three
// times: first to an empty host, then with no changes, then with one service changed.
func TestDeployRestartsOnlyServicesWhoseInputsChanged(t *testing.T) {
	src, err := filepath.Abs("../../examples/sample-shop")
	if err != nil {
		t.Fatal(err)
	}
	dir := t.TempDir()
	copyTree(t, src, dir)
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte("ORDERS_DB_URL=postgres://app@db.example.internal/orders\nPAYMENTS_DB_URL=postgres://app@db.example.internal/payments\nSTRIPE_SECRET_KEY=sk_test_placeholder\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	lock, err := analyzer.NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("analysis failed: %v", err)
	}
	writeProjectConfig(t, dir, lock)

	host := newStateHost()
	deploy := func() {
		t.Helper()
		host.restarts, host.uploads = nil, nil
		if err := deployer.NewDeployCoordinator(dir, host, lock).Deploy(context.Background(), "shop.example.test"); err != nil {
			t.Fatalf("deploy failed: %v", err)
		}
	}

	deploy()
	if len(host.restarts) != len(lock.Services) {
		t.Fatalf("first deploy should start every service, restarted %v", host.restarts)
	}

	deploy()
	if len(host.restarts) != 0 || len(host.uploads) != 0 {
		t.Fatalf("unchanged deploy should restart and upload nothing; restarted %v, uploaded %v", host.restarts, host.uploads)
	}

	// Change one service's code. Its binary changes; the other service's does not.
	ordersMain := filepath.Join(dir, "orders", "main.go")
	data, err := os.ReadFile(ordersMain)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(ordersMain, append(data, []byte("\n// change to force a new binary\n")...), 0o644); err != nil {
		t.Fatal(err)
	}
	deploy()
	if len(host.restarts) != 1 || host.restarts[0] != "orders" {
		t.Fatalf("only orders should restart; restarted %v", host.restarts)
	}
	if len(host.uploads) != 1 || !strings.HasSuffix(host.uploads[0], "/orders") {
		t.Fatalf("only the orders binary should upload; uploaded %v", host.uploads)
	}
}

// between returns the text between the first start and the next end after it.
func between(s, start, end string) string {
	i := strings.Index(s, start)
	if i < 0 {
		return ""
	}
	s = s[i+len(start):]
	j := strings.Index(s, end)
	if j < 0 {
		return s
	}
	return s[:j]
}
