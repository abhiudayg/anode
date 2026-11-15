package analyzer

import (
	"encoding/json"
	"path/filepath"
	"testing"
)

func TestLockfileIsIdenticalAcrossRuns(t *testing.T) {
	dir, err := filepath.Abs("testdata/storebind")
	if err != nil {
		t.Fatal(err)
	}
	var first []byte
	for run := 0; run < 3; run++ {
		lock, err := NewLoader(dir).LoadAndAnalyze("./...")
		if err != nil {
			t.Fatalf("run %d: LoadAndAnalyze failed: %v", run, err)
		}
		out, err := json.Marshal(lock)
		if err != nil {
			t.Fatal(err)
		}
		if run == 0 {
			first = out
			continue
		}
		if string(out) != string(first) {
			t.Fatalf("run %d produced a different lockfile than run 0; the output must not depend on map iteration order", run)
		}
	}
}
