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
