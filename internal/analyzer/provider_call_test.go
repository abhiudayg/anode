package analyzer

import (
	"path/filepath"
	"testing"
)

func TestProviderURLFallbackIsRecordedAsExternalEgress(t *testing.T) {
	dir, err := filepath.Abs("testdata/providercall")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	for _, rule := range lock.EgressRules {
		if rule.TargetHost == "https://api.example-pay.test/v1/charges" && rule.IsExternal {
			return
		}
	}
	t.Fatalf("the fallback base of providerURL must be recorded as external egress; rules: %+v", lock.EgressRules)
}
