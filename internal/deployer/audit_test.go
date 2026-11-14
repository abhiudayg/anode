package deployer

import (
	"strings"
	"testing"
)

func TestUnitRejectsEnvKeyThatWouldInjectDirective(t *testing.T) {
	_, err := GenerateSystemdUnit(SystemdUnitConfig{
		ServiceName: "orders",
		ExecStart:   "/var/lib/anode/releases/1/orders",
		StateDir:    "orders",
		EnvVars:     map[string]string{"X\nExecStartPre=+/bin/sh -c id": "1"},
	})
	if err == nil {
		t.Fatalf("expected an env key containing a newline to be rejected")
	}
}

func TestUnitRejectsEnvValueWithQuoteOrNewline(t *testing.T) {
	for _, value := range []string{"a\"b", "a\nExecStartPre=/bin/id"} {
		_, err := GenerateSystemdUnit(SystemdUnitConfig{
			ServiceName: "orders",
			ExecStart:   "/var/lib/anode/releases/1/orders",
			StateDir:    "orders",
			EnvVars:     map[string]string{"PORT": value},
		})
		if err == nil {
			t.Errorf("expected env value %q to be rejected", value)
		}
	}
}

func TestUnitRejectsNewlineInExecStart(t *testing.T) {
	_, err := GenerateSystemdUnit(SystemdUnitConfig{
		ServiceName: "orders",
		ExecStart:   "/bin/true\nExecStartPre=+/bin/id",
		StateDir:    "orders",
	})
	if err == nil || strings.Contains(err.Error(), "\n") {
		t.Fatalf("expected a newline in ExecStart to be rejected")
	}
}

func TestConfigHandoffRejectsShellAndSystemdMetacharacters(t *testing.T) {
	for _, name := range []string{"a b.json", "config;id.json", "x\n.json", "$(id).json", "../x.json", "config.yaml"} {
		if _, err := configHandoffCommand("orders", "/etc/anode/env/1.orders.config.json", name); err == nil {
			t.Errorf("expected config file name %q to be rejected", name)
		}
	}
}
