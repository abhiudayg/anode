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
	return fmt.Errorf("the host's redis-server is %s, but anode.toml asks for %s; the distribution package does not match the pinned version", got, want)
}
