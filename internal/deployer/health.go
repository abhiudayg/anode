package deployer

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

var safeRoutePath = regexp.MustCompile(`^/[A-Za-z0-9/_.-]*$`)

func healthRoutePath(svc iag.Service) (string, error) {
	for _, ing := range svc.Ingress {
		if ing.Protocol != "http" {
			continue
		}
		for _, route := range ing.Routes {
			fields := strings.Fields(route)
			path := route
			if len(fields) == 2 {
				path = fields[1]
			}
			path = strings.TrimSuffix(path, "{id}")
			if !safeRoutePath.MatchString(path) {
				return "", fmt.Errorf("route %q is not a safe health path", route)
			}
			return path, nil
		}
	}
	return "", nil
}

func httpHealthCommand(port int, path string) string {
	return fmt.Sprintf(
		"for i in 1 2 3 4 5 6 7 8 9 10; do c=$(curl -s -o /dev/null -w '%%{http_code}' --max-time 3 'http://127.0.0.1:%d%s'); if [ \"$c\" != 000 ] && [ \"$c\" -lt 500 ]; then exit 0; fi; sleep 1; done; exit 1",
		port, path,
	)
}
