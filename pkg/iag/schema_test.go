package iag_test

import (
	"encoding/json"
	"testing"

	"github.com/abhiudayg/anode/pkg/iag"
)

func TestIAGGraphSerialization(t *testing.T) {
	graph := iag.Graph{
		SchemaVersion: iag.V1,
		CommitSHA:     "abc1234",
		Resources: map[string]iag.Resource{
			"db-orders": {
				Kind:          iag.KindPostgres,
				EngineVersion: "16",
				Lifecycle:     iag.LifecycleStatefulRetain,
				Migrations: &iag.MigrationSpec{
					Tool:      "goose",
					Path:      "migrations/orders",
					Execution: "pre_traffic_job",
				},
			},
		},
		Services: map[string]iag.Service{
			"orders": {
				Name:       "orders",
				PackageDir: "./services/orders",
				Ingress: []iag.IngressSpec{
					{
						Protocol: "http",
						PortEnv:  "PORT",
						Routes:   []string{"POST /v1/orders"},
					},
				},
				Bindings: []iag.BindingSpec{
					{
						TargetKind: "resource",
						TargetRef:  "db-orders",
						Protocol:   "postgres",
						InjectEnv:  "ORDERS_DB_URL",
					},
				},
				Secrets: []string{"STRIPE_SECRET_KEY"},
			},
		},
	}

	data, err := json.Marshal(graph)
	if err != nil {
		t.Fatalf("Failed to marshal Graph: %v", err)
	}

	var parsed iag.Graph
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal Graph: %v", err)
	}

	if parsed.SchemaVersion != iag.V1 {
		t.Errorf("Expected schema version %s, got %s", iag.V1, parsed.SchemaVersion)
	}

	res, ok := parsed.Resources["db-orders"]
	if !ok || res.Kind != iag.KindPostgres {
		t.Errorf("Resource db-orders missing or wrong kind")
	}

	svc, ok := parsed.Services["orders"]
	if !ok || svc.Name != "orders" {
		t.Errorf("Service orders missing")
	}
	if len(svc.Ingress[0].Routes) != 1 || svc.Ingress[0].Routes[0] != "POST /v1/orders" {
		t.Errorf("Ingress routes missing or mismatched")
	}
}
