package deployer

import (
	"fmt"

	"github.com/abhiudayg/anode/internal/iag"
)

// healthPath is the route every HTTP service must serve. Deploy checks that it returns a status from 200 to 399.
const healthPath = "/healthz"

// hasHTTPService reports whether the service serves HTTP, so it must pass the health check.
func hasHTTPService(svc iag.Service) bool {
	for _, ing := range svc.Ingress {
		if ing.Protocol == "http" {
			return true
		}
	}
	return false
}

func httpHealthCommand(port int) string {
	return fmt.Sprintf(
		"for i in 1 2 3 4 5 6 7 8 9 10; do c=$(curl -s -o /dev/null -w '%%{http_code}' --max-time 3 'http://127.0.0.1:%d%s'); if [ \"$c\" -ge 200 ] && [ \"$c\" -lt 400 ]; then exit 0; fi; sleep 1; done; exit 1",
		port, healthPath,
	)
}
