package analyzer

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestStoreMigrationsAttachToTheServiceThatBindsTheStore(t *testing.T) {
	root := t.TempDir()
	for _, file := range []string{"migrations/fraud/001_create_checks.cql", "migrations/analytics/001_create_events.sql", "migrations/billing/001_notes.txt"} {
		if err := os.MkdirAll(filepath.Join(root, filepath.Dir(file)), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(root, file), []byte("-- x"), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	lock := &iag.LockFile{
		Services: map[string]iag.Service{
			"fraud":     {Bindings: []iag.Binding{{ResourceRef: "fraud-scylla"}}},
			"analytics": {Bindings: []iag.Binding{{ResourceRef: "analytics-clickhouse"}}},
			"billing":   {Bindings: []iag.Binding{{ResourceRef: "billing-clickhouse"}}},
		},
		Resources: map[string]iag.Resource{
			"fraud-scylla":         {Kind: "scylladb"},
			"analytics-clickhouse": {Kind: "clickhouse"},
			"billing-clickhouse":   {Kind: "clickhouse"},
		},
	}
	attachStoreMigrations(lock, root)

	fraud := lock.Resources["fraud-scylla"].Migrations
	if fraud == nil || fraud.Tool != "cql" || fraud.Path != "migrations/fraud" {
		t.Fatalf("scylla store must take its service's .cql migrations, got %+v", fraud)
	}
	analytics := lock.Resources["analytics-clickhouse"].Migrations
	if analytics == nil || analytics.Tool != "sql" || analytics.Path != "migrations/analytics" {
		t.Fatalf("clickhouse store must take its service's .sql migrations, got %+v", analytics)
	}
	if lock.Resources["billing-clickhouse"].Migrations != nil {
		t.Fatalf("a folder with no .sql or .cql files must not attach migrations")
	}
}
