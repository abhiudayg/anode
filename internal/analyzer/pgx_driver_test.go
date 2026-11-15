package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestPgxDriverNameIsPostgres(t *testing.T) {
	dir, err := filepath.Abs("../../examples/orders-api")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	res, ok := lock.Resources["db-orders-db"]
	if !ok || res.Kind != iag.KindPostgres {
		t.Fatalf("sql.Open(\"pgx\") must be a postgres resource, got %+v", lock.Resources)
	}
	if !res.AutoProvision {
		t.Errorf("a postgres resource with migrations must be auto-provisioned")
	}
}
