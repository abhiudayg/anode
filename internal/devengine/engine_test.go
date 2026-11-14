package devengine_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/devengine"
	"github.com/abhiudayg/anode/internal/iag"
)

func projectWithDotEnv(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, ".env"), []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	return dir
}

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

	dir := projectWithDotEnv(t, "DATABASE_URL=postgres://app@127.0.0.1:5432/orders\n")
	engine := devengine.NewEngine(dir, lockfile)
	plan, err := engine.PlanEnvVariables()
	if err != nil {
		t.Fatalf("PlanEnvVariables failed: %v", err)
	}

	ordersEnv := plan["orders"]
	paymentsEnv := plan["payments"]

	if ordersEnv["PORT"] == "" || paymentsEnv["PORT"] == "" {
		t.Errorf("expected PORT to be assigned for both services")
	}
	if ordersEnv["PORT"] == paymentsEnv["PORT"] {
		t.Errorf("expected distinct ports for orders and payments, got %s", ordersEnv["PORT"])
	}
	if ordersEnv["DATABASE_URL"] != "postgres://app@127.0.0.1:5432/orders" {
		t.Errorf("expected DATABASE_URL from .env, got %q", ordersEnv["DATABASE_URL"])
	}
	if !strings.Contains(ordersEnv["PAYMENTS_ADDR"], paymentsEnv["PORT"]) {
		t.Errorf("expected PAYMENTS_ADDR to reference payments port %s, got %s", paymentsEnv["PORT"], ordersEnv["PAYMENTS_ADDR"])
	}
}

func TestExternalDatabaseReadsDotEnvOnly(t *testing.T) {
	lockfile := &iag.LockFile{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-inventory": {
				Kind:          iag.KindPostgres,
				AutoProvision: false,
			},
		},
		Services: map[string]iag.Service{
			"inventory": {
				Name:       "inventory",
				Entrypoint: "./inventory",
				Bindings: []iag.Binding{
					{ResourceRef: "db-inventory", ExpandedEnv: []string{"DB_HOST", "DB_USER"}},
				},
			},
		},
	}

	dir := projectWithDotEnv(t, "INVENTORY_DB_URL=postgres://app@db.example.internal:5432/inventory\n")
	engine := devengine.NewEngine(dir, lockfile)
	plan, err := engine.PlanEnvVariables()
	if err != nil {
		t.Fatalf("PlanEnvVariables failed: %v", err)
	}

	env := plan["inventory"]
	if env["INVENTORY_DB_URL"] != "postgres://app@db.example.internal:5432/inventory" {
		t.Errorf("expected INVENTORY_DB_URL from .env, got %q", env["INVENTORY_DB_URL"])
	}
	for _, synthesized := range []string{"DB_HOST", "DB_USER"} {
		if _, ok := env[synthesized]; ok {
			t.Errorf("%s must not be invented for a database that is not provisioned locally", synthesized)
		}
	}
}

func TestMissingExternalDatabaseValueStopsPlan(t *testing.T) {
	lockfile := &iag.LockFile{
		SchemaVersion: iag.V1,
		Resources: map[string]iag.Resource{
			"db-inventory": {Kind: iag.KindPostgres},
		},
		Services: map[string]iag.Service{
			"inventory": {
				Name:     "inventory",
				Bindings: []iag.Binding{{ResourceRef: "db-inventory"}},
			},
		},
	}

	engine := devengine.NewEngine(t.TempDir(), lockfile)
	if _, err := engine.PlanEnvVariables(); err == nil {
		t.Fatalf("expected an error when the connection string is missing from .env")
	}
}

func TestSupervisorInitialization(t *testing.T) {
	lockfile := &iag.LockFile{SchemaVersion: iag.V1}
	sup := devengine.NewSupervisor(".", lockfile)
	if sup == nil {
		t.Fatal("expected non-nil supervisor")
	}
}
