package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestHasHTTPServiceOnlyForHTTPIngress(t *testing.T) {
	if !hasHTTPService(iag.Service{Ingress: []iag.Ingress{{Protocol: "http"}}}) {
		t.Fatalf("an http service must be health checked")
	}
	if hasHTTPService(iag.Service{Ingress: []iag.Ingress{{Protocol: "grpc"}}}) {
		t.Fatalf("a worker service must not be health checked")
	}
}

func TestHTTPHealthCommandRequiresHealthzAndAcceptsOnlySuccessAndRedirects(t *testing.T) {
	cmd := httpHealthCommand(21040)
	for _, want := range []string{"127.0.0.1:21040/healthz", `-ge 200`, `-lt 400`, "exit 1"} {
		if !strings.Contains(cmd, want) {
			t.Errorf("health command missing %q: %s", want, cmd)
		}
	}
	if strings.Contains(cmd, "-lt 500") {
		t.Errorf("an error page must not pass the health check: %s", cmd)
	}
}
