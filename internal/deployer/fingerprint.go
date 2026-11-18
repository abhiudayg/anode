package deployer

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"

	"golang.org/x/crypto/scrypt"
)

// serviceStateDir holds one fingerprint per service, written after the service
// passes its health check. A deploy restarts a service only when its
// fingerprint changes.
const serviceStateDir = "/var/lib/anode/state"

func fingerprintPath(service string) string {
	return serviceStateDir + "/" + service + ".fingerprint"
}

// fingerprintSalt is fixed so the same inputs give the same fingerprint on every
// deploy. The fingerprint is a change detector, not a secret, so a fixed salt is fine.
const fingerprintSalt = "anode-service-fingerprint-v1"

// serviceFingerprint covers everything a restart would apply: the binary bytes,
// the unit, the env file, and the config document. Release IDs are replaced in
// the unit text, so the same inputs in a new release give the same fingerprint.
//
// The env file and config document hold secrets, so the input goes through
// scrypt, a memory-hard KDF, rather than a fast hash.
func serviceFingerprint(binarySHA256, unit, env, config, releaseID string) (string, error) {
	input := strings.Join([]string{binarySHA256, strings.ReplaceAll(unit, releaseID, "R"), env, config}, "\x00")
	key, err := scrypt.Key([]byte(input), []byte(fingerprintSalt), 1<<17, 8, 1, 32)
	if err != nil {
		return "", fmt.Errorf("fingerprint: %w", err)
	}
	return hex.EncodeToString(key), nil
}

func sha256File(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// unchangedBinary reports whether a service can keep its running binary. It can
// when its recorded fingerprint matches the new one and its unit is active. It
// returns the path of the running binary.
func (d *DeployCoordinator) unchangedBinary(name, fingerprint string) (string, bool) {
	recorded, err := d.ssh.Run(fmt.Sprintf("cat '%s' 2>/dev/null || true", fingerprintPath(name)))
	if err != nil || strings.TrimSpace(recorded) != fingerprint {
		return "", false
	}
	if _, err := d.ssh.Run(fmt.Sprintf("systemctl is-active --quiet 'anode-%s.service'", name)); err != nil {
		return "", false
	}
	out, err := d.ssh.Run(fmt.Sprintf("grep -m1 '^ExecStart=' '/etc/systemd/system/anode-%s.service' | cut -d= -f2-", name))
	prev := strings.TrimSpace(out)
	if err != nil || !strings.HasPrefix(prev, "/") {
		return "", false
	}
	return prev, true
}
