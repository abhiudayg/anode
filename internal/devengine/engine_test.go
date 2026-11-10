package devengine_test

import (
	"strings"
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
	paymentsEnv := plan["payments"]

	if ordersEnv["PORT"] == "" {
		t.Errorf("expected PORT to be assigned for orders")
	}
	if paymentsEnv["PORT"] == "" {
		t.Errorf("expected PORT to be assigned for payments")
	}
	if ordersEnv["PORT"] == paymentsEnv["PORT"] {
		t.Errorf("expected distinct ports for orders and payments, got %s", ordersEnv["PORT"])
	}
	if ordersEnv["DATABASE_URL"] == "" {
		t.Errorf("expected DATABASE_URL to be injected for orders")
	}
	if ordersEnv["PAYMENTS_ADDR"] == "" {
		t.Errorf("expected PAYMENTS_ADDR to be injected pointing to payments port")
	}
	if !strings.Contains(ordersEnv["PAYMENTS_ADDR"], paymentsEnv["PORT"]) {
		t.Errorf("expected PAYMENTS_ADDR to reference payments port %s, got %s", paymentsEnv["PORT"], ordersEnv["PAYMENTS_ADDR"])
	}
}

func TestExpandedEnvDecomposition(t *testing.T) {
	lockfile := &iag.LockFile{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-inventory": {
				Kind:          iag.KindPostgres,
				AutoProvision: true,
			},
		},
		Services: map[string]iag.Service{
			"inventory": {
				Name:       "inventory",
				Entrypoint: "./inventory",
				Bindings: []iag.Binding{
					{
						ResourceRef: "db-inventory",
						ExpandedEnv: []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"},
					},
				},
			},
		},
	}

	engine := devengine.NewEngine(".", lockfile)
	plan, err := engine.PlanEnvVariables()
	if err != nil {
		t.Fatalf("PlanEnvVariables failed: %v", err)
	}

	env := plan["inventory"]
	if env["DB_HOST"] != "127.0.0.1" {
		t.Errorf("expected DB_HOST to be 127.0.0.1, got %s", env["DB_HOST"])
	}
	if env["DB_USER"] == "" {
		t.Errorf("expected DB_USER to be set")
	}
	if env["DB_NAME"] == "" {
		t.Errorf("expected DB_NAME to be set")
	}
}

func TestSupervisorInitialization(t *testing.T) {
	lockfile := &iag.LockFile{SchemaVersion: iag.V1}
	sup := devengine.NewSupervisor(".", lockfile)
	if sup == nil {
		t.Fatal("expected non-nil supervisor")
	}
}
