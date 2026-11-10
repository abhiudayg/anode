package catalog

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCatalogRegistryDefaults(t *testing.T) {
	reg := NewRegistry()

	kinds := reg.ListKinds()
	if len(kinds) < 10 {
		t.Fatalf("expected at least 10 default drivers, got %d", len(kinds))
	}

	// Verify Postgres driver
	pg := reg.Resolve("postgres")
	if pg.Kind != "postgres" {
		t.Fatalf("expected kind postgres, got %s", pg.Kind)
	}
	if pg.DefaultVersion != "16" {
		t.Errorf("expected default version 16, got %s", pg.DefaultVersion)
	}

	// Verify Version Pinning
	if img := pg.ResolveImage("14"); img != "postgres:14-alpine" {
		t.Errorf("expected postgres:14-alpine, got %s", img)
	}
	if img := pg.ResolveImage("15"); img != "postgres:15-alpine" {
		t.Errorf("expected postgres:15-alpine, got %s", img)
	}
	if img := pg.ResolveImage("16"); img != "postgres:16-alpine" {
		t.Errorf("expected postgres:16-alpine, got %s", img)
	}
	if img := pg.ResolveImage("17"); img != "postgres:17-alpine" {
		t.Errorf("expected postgres:17-alpine, got %s", img)
	}

	// Verify least privilege provision command
	cmd := pg.BuildProvisionCommand("orders-db", "16", "/var/lib/anode/data/orders-db")
	if !strings.Contains(cmd, "install -d -m 0700 -o 999 -g 999") {
		t.Errorf("expected deterministic POSIX directory setup with uid 999, got: %s", cmd)
	}
	if !strings.Contains(cmd, "no-new-privileges:true") {
		t.Errorf("expected least privilege no-new-privileges flag in: %s", cmd)
	}
	if !strings.Contains(cmd, "127.0.0.1:5432:5432") {
		t.Errorf("expected loopback bind interface in: %s", cmd)
	}
	if !strings.Contains(cmd, "--oom-score-adj=-900") {
		t.Errorf("expected DB OOM protection in: %s", cmd)
	}
}

func TestCatalogDynamicFallback(t *testing.T) {
	reg := NewRegistry()

	// Resolve uncataloged kind (e.g. ScyllaDB or arbitrary store #101)
	driver := reg.Resolve("scylladb")
	if driver.Kind != "scylladb" {
		t.Fatalf("expected fallback driver for scylladb, got %s", driver.Kind)
	}

	img := driver.ResolveImage("5.2")
	if img != "scylladb:5.2" {
		t.Errorf("expected scylladb:5.2, got %s", img)
	}

	cmd := driver.BuildProvisionCommand("scylla-main", "5.2", "/var/lib/anode/data/scylla")
	if !strings.Contains(cmd, "127.0.0.1") {
		t.Errorf("expected loopback bind for unknown kind, got: %s", cmd)
	}
}

func TestCatalogProjectOverride(t *testing.T) {
	tmpDir := t.TempDir()
	customYAML := `
drivers:
  postgres:
    kind: postgres
    default_version: "15"
    runtime:
      image_template: "custom-registry.internal/postgres:{{.Version}}"
      data_mount: "/var/lib/postgresql/data"
    networking:
      primary_port: 5433
`
	if err := os.WriteFile(filepath.Join(tmpDir, "anode.catalog.yaml"), []byte(customYAML), 0644); err != nil {
		t.Fatal(err)
	}

	reg := NewRegistry()
	reg.LoadProjectOverrides(tmpDir)

	pg := reg.Resolve("postgres")
	if pg.DefaultVersion != "15" {
		t.Errorf("expected overridden default version 15, got %s", pg.DefaultVersion)
	}
	if img := pg.ResolveImage("15"); img != "custom-registry.internal/postgres:15" {
		t.Errorf("expected custom image template, got %s", img)
	}
	if pg.Networking.PrimaryPort != 5433 {
		t.Errorf("expected overridden port 5433, got %d", pg.Networking.PrimaryPort)
	}
}
