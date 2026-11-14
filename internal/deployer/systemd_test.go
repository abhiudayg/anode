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
		StateDir:    "orders",
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

func TestSystemdUnitUsesDynamicUserWithoutStaticUser(t *testing.T) {
	unit, err := deployer.GenerateSystemdUnit(deployer.SystemdUnitConfig{
		ServiceName: "filebrowser-example",
		Description: "Filebrowser",
		ExecStart:   "/var/lib/anode/releases/1/filebrowser-example",
		StateDir:    "filebrowser-example",
	})
	if err != nil {
		t.Fatalf("GenerateSystemdUnit failed: %v", err)
	}
	for _, line := range strings.Split(unit, "\n") {
		if strings.HasPrefix(line, "User=") {
			t.Errorf("unit must not pin a static user, found %q", line)
		}
	}
	if !strings.Contains(unit, "StateDirectory=filebrowser-example") {
		t.Errorf("expected StateDirectory for writable state, got:\n%s", unit)
	}
	if strings.Contains(unit, "ReadWritePaths=") {
		t.Errorf("release folder must stay read-only; unexpected ReadWritePaths")
	}
}

func TestSystemdUnitRejectsUnsafeStateDir(t *testing.T) {
	for _, bad := range []string{"", "../etc", "a\nExecStartPre=/bin/sh", "Upper"} {
		_, err := deployer.GenerateSystemdUnit(deployer.SystemdUnitConfig{
			ExecStart: "/bin/true",
			StateDir:  bad,
		})
		if err == nil {
			t.Errorf("expected error for state directory %q", bad)
		}
	}
}

func TestGenerateCaddyfile(t *testing.T) {
	lockfile := &iag.LockFile{
		Services: map[string]iag.Service{
			"orders": {
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

	caddyfile := deployer.GenerateCaddyfile("api.example.com", lockfile, map[string]int{"orders": 8080})
	if !strings.Contains(caddyfile, "api.example.com {") {
		t.Errorf("expected domain in Caddyfile")
	}
	if !strings.Contains(caddyfile, "reverse_proxy 127.0.0.1:8080") {
		t.Errorf("expected proxy routing in Caddyfile")
	}
}
