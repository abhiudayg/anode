package analyzer

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestDependencyOwnedSinkIsDiagnosedNotBound(t *testing.T) {
	dir, err := filepath.Abs("testdata/dependencysink")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}

	for _, svc := range lock.Services {
		for _, b := range svc.Bindings {
			if b.Protocol == string(iag.KindPostgres) {
				t.Errorf("postgres opened in a dependency must not become a binding: %+v", b)
			}
		}
	}

	var diagnosed bool
	for _, d := range lock.Diagnostics {
		if strings.Contains(d.Message, "inside a dependency") {
			diagnosed = true
		}
	}
	if !diagnosed {
		t.Errorf("expected a diagnostic for the dependency-owned connection, got %+v", lock.Diagnostics)
	}
}

func TestDriverWrapperInsideDependencyIsNotDiagnosed(t *testing.T) {
	dir, err := filepath.Abs("../../examples/omni_mesh_32")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	for _, d := range lock.Diagnostics {
		if strings.Contains(d.Message, "inside a dependency") {
			t.Errorf("pgx's own wrapper must not be reported as a dependency-owned connection: %+v", d)
		}
	}
	if _, ok := lock.Services["orders"]; !ok {
		t.Fatalf("expected the orders service in the omni mesh lockfile")
	}
	var orderBindings int
	for _, b := range lock.Services["orders"].Bindings {
		if b.Protocol == string(iag.KindPostgres) {
			orderBindings++
		}
	}
	if orderBindings != 1 {
		t.Errorf("expected one postgres binding for orders, got %d", orderBindings)
	}
}
