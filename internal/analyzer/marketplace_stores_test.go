package analyzer

import (
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestMarketplaceKafkaWriterAndQdrantAreStoreResources(t *testing.T) {
	dir, err := filepath.Abs("../../examples/marketplace")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	if res, ok := lock.Resources["shipping-kafka"]; !ok || res.Kind != iag.ResourceKind("kafka") {
		t.Fatalf("shipping-kafka must be a kafka resource, got %+v", lock.Resources["shipping-kafka"])
	}
	if !hasBinding(lock.Services["shipping"], "shipping-kafka", "SHIPPING_KAFKA_BROKERS") {
		t.Errorf("shipping must bind shipping-kafka through SHIPPING_KAFKA_BROKERS: %+v", lock.Services["shipping"].Bindings)
	}
	if !hasBinding(lock.Services["search"], "search-qdrant", "SEARCH_QDRANT_URL") {
		t.Errorf("search must bind search-qdrant through SEARCH_QDRANT_URL: %+v", lock.Services["search"].Bindings)
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
