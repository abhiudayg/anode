package devengine_test

import (
	"testing"

	"github.com/abhiudayg/anode/internal/devengine"
	"github.com/abhiudayg/anode/internal/iag"
)

func TestPlanEnvVariables(t *testing.T) {
	lockfile := &iag.LockFile{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-orders": {
				Kind:          iag.KindPostgres,
				AutoProvision: true,
			},
		},
		Services: map[string]iag.Service{
			"orders": {
				Name:       "orders",
				Entrypoint: "./orders",
				Bindings: []iag.Binding{
					{ResourceRef: "db-orders", InjectEnv: "DATABASE_URL"},
					{ServiceRef: "payments", InjectEnv: "PAYMENTS_ADDR"},
				},
			},
			"payments": {
				Name:       "payments",
				Entrypoint: "./payments",
			},
		},
	}

	engine := devengine.NewEngine(".", lockfile)
	plan, err := engine.PlanEnvVariables()
	if err != nil {
		t.Fatalf("PlanEnvVariables failed: %v", err)
	}

	ordersEnv := plan["orders"]
	if ordersEnv["PORT"] == "" {
		t.Errorf("expected PORT to be assigned for orders")
	}
	if ordersEnv["DATABASE_URL"] == "" {
		t.Errorf("expected DATABASE_URL to be injected for orders")
	}
	if ordersEnv["PAYMENTS_ADDR"] == "" {
		t.Errorf("expected PAYMENTS_ADDR to be injected pointing to payments port")
	}

	paymentsEnv := plan["payments"]
	if paymentsEnv["PORT"] == "" {
		t.Errorf("expected PORT to be assigned for payments")
	}
}
