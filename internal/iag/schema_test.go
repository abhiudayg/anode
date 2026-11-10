package iag_test

import (
	"encoding/json"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestHardenedIAGSerialization(t *testing.T) {
	graph := iag.Graph{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-orders": {
				Kind:       iag.KindPostgres,
				Lifecycle:  iag.LifecycleStatefulRetain,
				Provenance: "main.go:40",
				Migrations: &iag.MigrationSpec{
					Tool:      "goose",
					Path:      "migrations/orders",
					Execution: "pre_traffic_job",
				},
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
						ExpandedEnv: []string{"DB_HOST", "DB_PORT"},
						Provenance:  "main.go:40",
					},
				},
			},
		},
		EgressRules: []iag.EgressRule{
			{
				SourceService: "orders",
				TargetHost:    "https://api.stripe.com/v1/charges",
				Port:          443,
				Protocol:      "https",
				IsExternal:    true,
			},
		},
		Diagnostics: []iag.Diagnostic{
			{
				Level:      "info",
				Message:    "All topologies verified successfully",
				Provenance: "orders/main.go:1",
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

	if parsed.SchemaVersion != iag.V1 {
		t.Errorf("expected 1.0, got %s", parsed.SchemaVersion)
	}
	if len(parsed.EgressRules) != 1 || !parsed.EgressRules[0].IsExternal {
		t.Errorf("expected external egress rule preserved")
	}
	if len(parsed.Diagnostics) != 1 {
		t.Errorf("expected diagnostic message preserved")
	}
}
