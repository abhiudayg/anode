package analyzer

import (
	"path/filepath"
	"testing"
)

func TestSecretReadInsideDependencyIsNotAttributedToProject(t *testing.T) {
	dir, err := filepath.Abs("testdata/envdep")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	for name, svc := range lock.Services {
		for _, secret := range svc.Secrets {
			t.Errorf("service %s records dependency secret %s at %s; a provenance outside the project must not be recorded", name, secret.EnvVar, secret.Provenance)
		}
	}
}
