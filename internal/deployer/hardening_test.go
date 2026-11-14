package deployer

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDotEnvReadableByOthersIsRefused(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, ".env")
	if err := os.WriteFile(path, []byte("A=1\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := checkDotEnvPermissions(dir); err == nil {
		t.Fatalf(".env readable by other users must be refused")
	}
	if err := os.Chmod(path, 0o600); err != nil {
		t.Fatal(err)
	}
	if err := checkDotEnvPermissions(dir); err != nil {
		t.Fatalf("a 0600 .env must pass: %v", err)
	}
}

func TestIsIPTarget(t *testing.T) {
	cases := map[string]bool{
		"root@192.168.139.32":    true,
		"192.168.139.32":         true,
		"root@203.0.113.5:22":    true,
		"deploy@api.example.com": false,
		"api.example.com":        false,
	}
	for target, want := range cases {
		if got := IsIPTarget(target); got != want {
			t.Errorf("IsIPTarget(%s) = %v, want %v", target, got, want)
		}
	}
}

func TestFirewallCommandPersistsTheRule(t *testing.T) {
	cmd := appPortFirewallCommand()
	for _, want := range []string{"iptables -I INPUT", "netfilter-persistent save", "iptables-persistent"} {
		if !strings.Contains(cmd, want) {
			t.Errorf("firewall command missing %q: %s", want, cmd)
		}
	}
}
