package deployer

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestLockfileReserializesToTheBytesInspectWrote(t *testing.T) {
	path := filepath.Join("..", "..", "examples", "marketplace", "anode.lock.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var lock iag.LockFile
	if err := json.Unmarshal(data, &lock); err != nil {
		t.Fatal(err)
	}
	again, err := json.MarshalIndent(&lock, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(again, data) {
		t.Fatalf("the release record hashes the re-serialized lockfile; it must equal the file inspect wrote (length %d vs %d)", len(again), len(data))
	}
}
