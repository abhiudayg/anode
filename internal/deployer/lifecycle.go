package deployer

import (
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

const (
	releasesRoot = "/var/lib/anode/releases"
	envRoot      = "/etc/anode/env"
	unitRoot     = "/etc/systemd/system"
	keptReleases = 3
)

var releaseIDPattern = regexp.MustCompile(`^[0-9]{1,20}$`)

func parseReleaseIDs(listing string) []string {
	var ids []string
	for _, line := range strings.Split(listing, "\n") {
		id := strings.TrimSpace(line)
		if releaseIDPattern.MatchString(id) {
			ids = append(ids, id)
		}
	}
	sort.Slice(ids, func(i, j int) bool {
		a, _ := strconv.ParseInt(ids[i], 10, 64)
		b, _ := strconv.ParseInt(ids[j], 10, 64)
		return a > b
	})
	return ids
}

func releasesToRemove(newestFirst []string, keep int) []string {
	if len(newestFirst) <= keep {
		return nil
	}
	return newestFirst[keep:]
}

func unitsToRemove(units []string, keep map[string]bool) []string {
	var stale []string
	for _, unit := range units {
		if strings.HasPrefix(unit, "anode-") && strings.HasSuffix(unit, ".service") && !keep[unit] {
			stale = append(stale, unit)
		}
	}
	return stale
}

func (d *DeployCoordinator) pruneHost(keepUnits map[string]bool) error {
	listing, err := d.ssh.Run("ls -1 " + releasesRoot + " 2>/dev/null || true")
	if err != nil {
		return fmt.Errorf("failed to list releases: %w", err)
	}
	for _, id := range releasesToRemove(parseReleaseIDs(listing), keptReleases) {
		cmd := fmt.Sprintf("rm -rf '%s/%s' && rm -f %s/%s.*", releasesRoot, id, envRoot, id)
		if _, err := d.ssh.Run(cmd); err != nil {
			return fmt.Errorf("failed to remove release %s: %w", id, err)
		}
	}

	unitListing, err := d.ssh.Run("ls -1 " + unitRoot + " 2>/dev/null || true")
	if err != nil {
		return fmt.Errorf("failed to list units: %w", err)
	}
	for _, unit := range unitsToRemove(strings.Fields(unitListing), keepUnits) {
		cmd := fmt.Sprintf("systemctl disable --now '%s' >/dev/null 2>&1; rm -f '%s/%s'; systemctl daemon-reload", unit, unitRoot, unit)
		if _, err := d.ssh.Run(cmd); err != nil {
			return fmt.Errorf("failed to remove stale unit %s: %w", unit, err)
		}
	}
	return nil
}
