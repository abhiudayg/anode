package catalog

import (
	"strings"
	"testing"
)

func TestContainerPasswordStaysOutOfProvisionCommand(t *testing.T) {
	pg := NewRegistry().Resolve("postgres")
	const secret = "placeholder-container-password"
	env := pg.RuntimeEnvFile("db-orders", secret)
	if !strings.Contains(env, "POSTGRES_PASSWORD="+secret+"\n") {
		t.Fatalf("env file must carry the .env password:\n%s", env)
	}
	cmd := pg.BuildProvisionCommand("db-orders", "16", "/var/lib/anode/data/db-orders", "/etc/anode/env/db-orders.docker.env", pg.Networking.PrimaryPort)
	if strings.Contains(cmd, secret) || strings.Contains(cmd, "POSTGRES_PASSWORD") {
		t.Fatalf("provision command must not carry the password:\n%s", cmd)
	}
	if !strings.Contains(cmd, "--env-file '/etc/anode/env/db-orders.docker.env'") {
		t.Fatalf("provision command must read the env file:\n%s", cmd)
	}
}

func TestConnectionEnvUsesPassedPassword(t *testing.T) {
	pg := NewRegistry().Resolve("postgres")
	if got := pg.BuildConnectionEnv("db-orders", "127.0.0.1", 5432, "db-orders", "pw-1")["URL"]; !strings.Contains(got, ":pw-1@") {
		t.Fatalf("connection URL must use the passed password, got %s", got)
	}
}

func TestNoDefaultPasswordLiteralsRemain(t *testing.T) {
	for _, kind := range []string{"postgres", "timescaledb", "mysql", "mariadb", "minio", "rabbitmq"} {
		spec := NewRegistry().Resolve(kind)
		if spec.Runtime.PasswordEnv == "" {
			t.Errorf("%s must name its password variable", kind)
		}
		if _, literal := spec.Runtime.DefaultEnv[spec.Runtime.PasswordEnv]; literal {
			t.Errorf("%s must not set its password in default_env", kind)
		}
	}
}

func TestContainerCPUQuotaIsConvertedToCPUs(t *testing.T) {
	pg := NewRegistry().Resolve("postgres")
	cmd := pg.BuildProvisionCommand("db-orders", "16", "/var/lib/anode/data/db-orders", "/etc/anode/env/db-orders.docker.env", pg.Networking.PrimaryPort)
	if !strings.Contains(cmd, "--cpus=2 ") {
		t.Fatalf("a 200%% quota must become --cpus=2, got:\n%s", cmd)
	}
}

func TestReadinessCommandWaitsForContainer(t *testing.T) {
	cmd := NewRegistry().Resolve("postgres").ReadinessCommand("db-orders")
	if !strings.Contains(cmd, "docker exec 'anode-db-orders' pg_isready") || !strings.Contains(cmd, "seq 1 60") {
		t.Fatalf("readiness must retry pg_isready inside the container, got: %s", cmd)
	}
}
