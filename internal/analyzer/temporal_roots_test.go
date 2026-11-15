package analyzer

import (
	"path/filepath"
	"testing"
)

func TestTemporalActivityCallsAreRecorded(t *testing.T) {
	dir, err := filepath.Abs("testdata/temporalroots")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	for _, b := range lock.Services["temporalroots"].Bindings {
		if b.Protocol == "http" && b.InjectEnv == "AUDIT_SERVICE_URL" {
			return
		}
	}
	t.Fatalf("the outbound call inside a Temporal activity must be recorded; bindings: %+v", lock.Services["temporalroots"].Bindings)
}
