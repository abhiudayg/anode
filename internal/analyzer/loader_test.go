package analyzer

import (
	"path/filepath"
	"testing"
)

func TestHyperMesh12Analysis(t *testing.T) {
	hyperMeshDir, err := filepath.Abs("../../testdata/hyper_mesh_12")
	if err != nil {
		t.Fatalf("failed to get abs path: %v", err)
	}

	loader := NewLoader(hyperMeshDir)
	lockfile, err := loader.LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}

	t.Logf("Found %d services and %d resources", len(lockfile.Services), len(lockfile.Resources))

	// Verify all 12 services exist
	expectedServices := []string{
		"apigateway", "auth", "userprofile", "catalog", "orders", "ledger",
		"payments", "inventory", "fulfillment", "notifications", "auditlog", "analytics",
	}
	for _, expected := range expectedServices {
		svc, ok := lockfile.Services[expected]
		if !ok {
			t.Errorf("missing service: %s", expected)
		} else {
			t.Logf("Service %s: %d ingresses, %d bindings, %d secrets",
				expected, len(svc.Ingress), len(svc.Bindings), len(svc.Secrets))
			for _, b := range svc.Bindings {
				t.Logf("  Binding: resource=%s service=%s proto=%s inject=%s expanded=%v",
					b.ResourceRef, b.ServiceRef, b.Protocol, b.InjectEnv, b.ExpandedEnv)
			}
		}
	}

	// Verify resources
	for rID, res := range lockfile.Resources {
		t.Logf("Resource %s: kind=%s auto=%v mig=%v", rID, res.Kind, res.AutoProvision, res.Migrations)
	}

	// Verify egress rules
	for _, eg := range lockfile.EgressRules {
		t.Logf("Egress: %s -> %s", eg.SourceService, eg.TargetHost)
	}
}
