package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestKafkaWriterAndQdrantURLBindAsStoreResources(t *testing.T) {
	dir, err := filepath.Abs("testdata/storebind")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	if res, ok := lock.Resources["orders-kafka"]; !ok || res.Kind != iag.ResourceKind("kafka") {
		t.Fatalf("orders-kafka must be a kafka resource, got %+v", lock.Resources["orders-kafka"])
	}
	if !hasBinding(lock.Services["storebind"], "orders-kafka", "ORDERS_KAFKA_BROKERS") {
		t.Errorf("service must bind orders-kafka through ORDERS_KAFKA_BROKERS: %+v", lock.Services["storebind"].Bindings)
	}
	if !hasBinding(lock.Services["storebind"], "search-qdrant", "SEARCH_QDRANT_URL") {
		t.Errorf("service must bind search-qdrant through SEARCH_QDRANT_URL: %+v", lock.Services["storebind"].Bindings)
	}
	if len(lock.Diagnostics) != 0 {
		t.Errorf("no diagnostics expected once Qdrant and Kafka are bound, got %+v", lock.Diagnostics)
	}
}

func hasBinding(svc iag.Service, resourceRef, injectEnv string) bool {
	for _, b := range svc.Bindings {
		if b.ResourceRef == resourceRef && b.InjectEnv == injectEnv {
			return true
		}
	}
	return false
}
