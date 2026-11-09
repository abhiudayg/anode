package deployer_test

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/iag"
)

func TestGenerateSystemdUnit(t *testing.T) {
	unit, err := deployer.GenerateSystemdUnit(deployer.SystemdUnitConfig{
		ServiceName: "orders",
		Description: "Orders Microservice",
		ExecStart:   "/var/lib/anode/bin/orders",
		WorkingDir:  "/var/lib/anode/app",
		EnvVars: map[string]string{
			"PORT":         "8080",
			"DATABASE_URL": "postgres://localhost/orders",
		},
	})
	if err != nil {
		t.Fatalf("GenerateSystemdUnit failed: %v", err)
	}

	if !strings.Contains(unit, "ExecStart=/var/lib/anode/bin/orders") {
		t.Errorf("expected ExecStart in unit, got:\n%s", unit)
	}
	if !strings.Contains(unit, "MemoryMax=1G") {
		t.Errorf("expected MemoryMax cgroups v2 directive")
	}
}

func TestGenerateCaddyfile(t *testing.T) {
	graph := &iag.Graph{
		Services: []iag.Service{
			{
				Name: "orders",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						Routes:   []string{"POST /v1/orders"},
					},
				},
			},
		},
	}

	caddyfile := deployer.GenerateCaddyfile("api.example.com", graph, map[string]int{"orders": 8080})
	if !strings.Contains(caddyfile, "api.example.com {") {
		t.Errorf("expected domain in Caddyfile")
	}
	if !strings.Contains(caddyfile, "reverse_proxy 127.0.0.1:8080") {
		t.Errorf("expected proxy routing in Caddyfile")
	}
}
