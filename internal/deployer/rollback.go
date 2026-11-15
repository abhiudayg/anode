package deployer

import (
	"fmt"
	"regexp"
	"strings"
)

var recordedUnitPattern = regexp.MustCompile(`^anode-[a-z0-9][a-z0-9-]{0,62}\.service$`)

func Rollback(client Remote) (string, error) {
	listing, err := client.Run("ls -1 " + releasesRoot + " 2>/dev/null || true")
	if err != nil {
		return "", fmt.Errorf("failed to list releases: %w", err)
	}
	ids := parseReleaseIDs(listing)
	if len(ids) < 2 {
		return "", fmt.Errorf("no previous release on this host to roll back to")
	}
	previous := ids[1]
	if err := verifyReleaseRecord(client, previous); err != nil {
		return "", err
	}

	unitsOut, err := client.Run(fmt.Sprintf("ls -1 %s/%s 2>/dev/null || true", releasesRoot, previous))
	if err != nil {
		return "", fmt.Errorf("failed to read release %s: %w", previous, err)
	}
	var units []string
	for _, name := range strings.Fields(unitsOut) {
		if recordedUnitPattern.MatchString(name) {
			units = append(units, name)
		}
	}
	if len(units) == 0 {
		return "", fmt.Errorf("release %s has no recorded service units", previous)
	}

	for _, unit := range units {
		recorded := fmt.Sprintf("%s/%s/%s", releasesRoot, previous, unit)
		cmd := fmt.Sprintf(
			"cp '%s' '%s/%s' && systemctl daemon-reload && systemctl restart '%s' && sleep 2 && systemctl is-active --quiet '%s'",
			recorded, unitRoot, unit, unit, unit,
		)
		if _, err := client.Run(cmd); err != nil {
			return "", fmt.Errorf("rollback of %s to release %s failed: %w", unit, previous, err)
		}
	}

	recordedCaddy := fmt.Sprintf("%s/%s/Caddyfile", releasesRoot, previous)
	if _, err := client.Run(fmt.Sprintf("test -f '%s'", recordedCaddy)); err != nil {
		return "", fmt.Errorf("release %s has no recorded Caddyfile: its service units were restored but its routes were not", previous)
	}
	restoreCaddy := fmt.Sprintf("cp '%s' /etc/caddy/Caddyfile && caddy validate --config /etc/caddy/Caddyfile && (systemctl reload caddy || systemctl restart caddy)", recordedCaddy)
	if _, err := client.Run(restoreCaddy); err != nil {
		return "", fmt.Errorf("restoring routes of release %s failed: %w", previous, err)
	}
	return previous, nil
}

func verifyReleaseRecord(client Remote, id string) error {
	lockPath := fmt.Sprintf("%s/%s/anode.lock.json", releasesRoot, id)
	hashPath := fmt.Sprintf("%s/%s.lock.sha256", releasesRoot, id)
	out, err := client.Run(fmt.Sprintf("echo \"$(sha256sum '%s' | cut -d' ' -f1) $(cat '%s')\"", lockPath, hashPath))
	if err != nil {
		return fmt.Errorf("release %s has no verifiable lockfile record: %w", id, err)
	}
	fields := strings.Fields(out)
	if len(fields) != 2 || fields[0] != fields[1] {
		return fmt.Errorf("release %s: the recorded lockfile does not match its recorded hash; rollback refused", id)
	}
	return nil
}
