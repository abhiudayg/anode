package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestStoreClientsBindToNamedResources(t *testing.T) {
	dir, err := filepath.Abs("testdata/clientsinks")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}

	want := map[string]struct {
		kind   iag.ResourceKind
		envVar string
	}{
		"events-rabbitmq": {"rabbitmq", "EVENTS_RABBITMQ_URL"},
		"media-minio":     {"minio", "MEDIA_MINIO_ENDPOINT"},
		"catalog-mongo":   {"mongodb", "CATALOG_MONGO_URI"},
		"jobs-temporal":   {"temporal", "JOBS_TEMPORAL_ADDR"},
	}
	for id, expect := range want {
		res, ok := lock.Resources[id]
		if !ok {
			t.Errorf("expected resource %s, got resources %v", id, resourceIDs(lock))
			continue
		}
		if res.Kind != expect.kind {
			t.Errorf("%s kind = %s, want %s", id, res.Kind, expect.kind)
		}
	}

	bound := map[string]string{}
	for _, b := range lock.Services["clientsinks"].Bindings {
		bound[b.ResourceRef] = b.InjectEnv
	}
	for id, expect := range want {
		if got := bound[id]; got != expect.envVar {
			t.Errorf("binding %s inject_env = %q, want %q", id, got, expect.envVar)
		}
	}
}

func resourceIDs(lock *iag.LockFile) []string {
	ids := make([]string, 0, len(lock.Resources))
	for id := range lock.Resources {
		ids = append(ids, id)
	}
	return ids
}
