package iag_test

import (
	"encoding/json"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestIAGSerialization(t *testing.T) {
	graph := iag.Graph{
		SchemaVersion: "1.0",
		Resources: map[string]iag.Resource{
			"db-orders": {
				Kind:       "postgres",
				Lifecycle:  "stateful_retain",
				Provenance: "main.go:40",
			},
		},
		Services: []iag.Service{
			{
				Name:       "orders",
				Entrypoint: "./orders",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						PortEnv:  "PORT",
						Routes:   []string{"POST /v1/orders"},
					},
				},
				Bindings: []iag.Binding{
					{
						ResourceRef: "db-orders",
						Protocol:    "postgres",
						InjectEnv:   "DATABASE_URL",
						Provenance:  "main.go:40",
					},
				},
			},
		},
	}

	data, err := json.Marshal(graph)
	if err != nil {
		t.Fatalf("failed to marshal IAG: %v", err)
	}

	var parsed iag.Graph
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal IAG: %v", err)
	}

	if parsed.SchemaVersion != "1.0" {
		t.Errorf("expected 1.0, got %s", parsed.SchemaVersion)
	}
	if len(parsed.Services) != 1 || parsed.Services[0].Name != "orders" {
		t.Errorf("unexpected services: %+v", parsed.Services)
	}
	if res, ok := parsed.Resources["db-orders"]; !ok || res.Kind != "postgres" {
		t.Errorf("unexpected resource: %+v", res)
	}
}
