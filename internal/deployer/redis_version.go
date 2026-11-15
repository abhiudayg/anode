package deployer

import (
	"fmt"
	"strings"
)

// checkRedisVersion accepts the output of `redis-server --version` when its version matches the requested one.
// "7" matches 7.0.15 and 7.2.4. "7.2" matches 7.2.4 but not 7.0.15.
func checkRedisVersion(versionOutput, want string) error {
	got := ""
	for _, field := range strings.Fields(versionOutput) {
		if v, ok := strings.CutPrefix(field, "v="); ok {
			got = v
			break
		}
	}
	if got == "" {
		return fmt.Errorf("could not read the installed redis version from %q", strings.TrimSpace(versionOutput))
	}
	if got == want || strings.HasPrefix(got, want+".") {
		return nil
	}
	return fmt.Errorf("the host has redis-server %s, but anode.toml asks for %s. Set version = %q in anode.toml to use what the host provides, or set runtime = \"docker\"", got, want, redisMajorMinor(got))
}

func redisMajorMinor(version string) string {
	parts := strings.SplitN(version, ".", 3)
	if len(parts) < 2 {
		return version
	}
	return parts[0] + "." + parts[1]
}
