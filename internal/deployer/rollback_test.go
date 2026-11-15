package deployer

import (
	"fmt"
	"os"
	"strings"
	"testing"
)

type scriptedHost struct {
	commands []string
	answer   func(cmd string) (string, error)
}

func (h *scriptedHost) Run(cmd string) (string, error) {
	h.commands = append(h.commands, cmd)
	return h.answer(cmd)
}

func (h *scriptedHost) StreamBytes([]byte, string, os.FileMode) error { return nil }

func (h *scriptedHost) StreamFile(string, string, os.FileMode) error { return nil }

func (h *scriptedHost) touched(substr string) bool {
	for _, c := range h.commands {
		if strings.Contains(c, substr) {
			return true
		}
	}
	return false
}

func releaseHost(recordMatches, hasCaddy bool) *scriptedHost {
	return &scriptedHost{answer: func(cmd string) (string, error) {
		switch {
		case strings.HasPrefix(cmd, "ls -1 /var/lib/anode/releases 2>"):
			return "1002\n1001\n", nil
		case strings.HasPrefix(cmd, "ls -1 /var/lib/anode/releases/1001"):
			return "anode-shipping.service\nCaddyfile\nanode.lock.json\n", nil
		case strings.Contains(cmd, "sha256sum"):
			if recordMatches {
				return "abc abc\n", nil
			}
			return "abc def\n", nil
		case strings.HasPrefix(cmd, "test -f"):
			if hasCaddy {
				return "", nil
			}
			return "", fmt.Errorf("exit 1")
		}
		return "", nil
	}}
}

func TestRollbackRefusesARecordWhoseLockfileDoesNotMatchItsHash(t *testing.T) {
	host := releaseHost(false, true)
	if _, err := Rollback(host); err == nil || !strings.Contains(err.Error(), "does not match") {
		t.Fatalf("a corrupt release record must be refused, got %v", err)
	}
	if host.touched("/etc/systemd/system") || host.touched("/etc/caddy/Caddyfile") {
		t.Fatalf("a refused rollback must not change the host")
	}
}

func TestRollbackRestoresUnitsAndRoutesOfThePreviousRelease(t *testing.T) {
	host := releaseHost(true, true)
	previous, err := Rollback(host)
	if err != nil {
		t.Fatalf("rollback to a verified release must succeed: %v", err)
	}
	if previous != "1001" {
		t.Fatalf("rollback must return the previous release, got %s", previous)
	}
	if !host.touched("/etc/caddy/Caddyfile") || !host.touched("caddy validate") {
		t.Fatalf("rollback must restore and validate the recorded routes")
	}
}

func TestRollbackReportsWhenReleaseHasNoRecordedRoutes(t *testing.T) {
	host := releaseHost(true, false)
	_, err := Rollback(host)
	if err == nil || !strings.Contains(err.Error(), "routes were not") {
		t.Fatalf("a release without recorded routes must say its routes were not restored, got %v", err)
	}
	if host.touched("/etc/caddy/Caddyfile") {
		t.Fatalf("no routes may be written when no Caddyfile was recorded")
	}
}
