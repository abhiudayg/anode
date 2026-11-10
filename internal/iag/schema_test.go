package iag_test

import (
	"encoding/json"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestLockFileSerialization(t *testing.T) {
	lockfile := iag.LockFile{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-orders": {
				Kind:          iag.KindPostgres,
				Lifecycle:     iag.LifecycleStatefulRetain,
				AutoProvision: true,
				Provenance:    "main.go:40",
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
				Entrypoint: "./orders",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						PortEnv:  "PORT",
						Routes:   []string{"POST /v1/orders"},
					},
					{
						Protocol: "grpc",
						PortEnv:  "PORT",
						Service:  "orders.v1.OrderService",
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

	data, err := json.Marshal(lockfile)
	if err != nil {
		t.Fatalf("failed to marshal LockFile: %v", err)
	}

	var parsed iag.LockFile
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to unmarshal LockFile: %v", err)
	}

	if parsed.SchemaVersion != iag.V1 {
		t.Errorf("expected 1.0, got %s", parsed.SchemaVersion)
	}
	if len(parsed.Services) != 1 || parsed.Services["orders"].Name != "orders" {
		t.Errorf("unexpected services: %+v", parsed.Services)
	}
	if !parsed.Resources["db-orders"].AutoProvision {
		t.Errorf("expected AutoProvision true")
	}
}
