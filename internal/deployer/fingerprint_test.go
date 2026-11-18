package deployer

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
)

func TestServiceFingerprintIgnoresReleaseIdentity(t *testing.T) {
	unitRelease1 := "Description=Anode orders (release 1000)\nExecStart=/var/lib/anode/releases/1000/orders\nEnvironmentFile=/etc/anode/env/1000.orders\n"
	unitRelease2 := "Description=Anode orders (release 2000)\nExecStart=/var/lib/anode/releases/2000/orders\nEnvironmentFile=/etc/anode/env/2000.orders\n"

	a := serviceFingerprint("bin", unitRelease1, "DB=x\n", "", "1000")
	b := serviceFingerprint("bin", unitRelease2, "DB=x\n", "", "2000")
	if a != b {
		t.Fatalf("same inputs in a new release must match")
	}
}

func TestServiceFingerprintChangesWhenAnyInputChanges(t *testing.T) {
	unit := "ExecStart=/var/lib/anode/releases/1000/orders\n"
	base := serviceFingerprint("bin", unit, "DB=x\n", "", "1000")

	cases := map[string]string{
		"binary": serviceFingerprint("bin2", unit, "DB=x\n", "", "1000"),
		"env":    serviceFingerprint("bin", unit, "DB=y\n", "", "1000"),
		"config": serviceFingerprint("bin", unit, "DB=x\n", `{"dsn":"a"}`, "1000"),
		"unit":   serviceFingerprint("bin", unit+"MemoryMax=512M\n", "DB=x\n", "", "1000"),
	}
	for name, got := range cases {
		if got == base {
			t.Errorf("change in %s must change the fingerprint", name)
		}
	}
}

// fingerprintHost answers Run by matching the command against fixed responses.
type fingerprintHost struct {
	fingerprint string // contents of the recorded fingerprint file
	active      bool   // whether systemctl is-active succeeds
	execStart   string // ExecStart line of the installed unit
}

func (h *fingerprintHost) Run(cmd string) (string, error) {
	switch {
	case strings.HasPrefix(cmd, "cat "):
		return h.fingerprint, nil
	case strings.HasPrefix(cmd, "systemctl is-active"):
		if h.active {
			return "", nil
		}
		return "", errors.New("inactive")
	case strings.HasPrefix(cmd, "grep -m1 '^ExecStart="):
		return h.execStart + "\n", nil
	}
	return "", fmt.Errorf("unexpected command: %s", cmd)
}

func (h *fingerprintHost) StreamBytes([]byte, string, os.FileMode) error { return nil }
func (h *fingerprintHost) StreamFile(string, string, os.FileMode) error  { return nil }

func TestUnchangedBinaryRequiresMatchingFingerprintAndActiveUnit(t *testing.T) {
	const want = "abc"
	cases := []struct {
		name string
		host fingerprintHost
		ok   bool
	}{
		{"matching and active", fingerprintHost{fingerprint: want + "\n", active: true, execStart: "/var/lib/anode/releases/1/orders"}, true},
		{"fingerprint differs", fingerprintHost{fingerprint: "other", active: true, execStart: "/var/lib/anode/releases/1/orders"}, false},
		{"no fingerprint recorded", fingerprintHost{active: true, execStart: "/var/lib/anode/releases/1/orders"}, false},
		{"unit not active", fingerprintHost{fingerprint: want, active: false, execStart: "/var/lib/anode/releases/1/orders"}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			host := tc.host
			d := &DeployCoordinator{ssh: &host}
			prev, ok := d.unchangedBinary("orders", want)
			if ok != tc.ok {
				t.Fatalf("unchanged = %v, want %v", ok, tc.ok)
			}
			if ok && prev != "/var/lib/anode/releases/1/orders" {
				t.Fatalf("prev binary = %q", prev)
			}
		})
	}
}
