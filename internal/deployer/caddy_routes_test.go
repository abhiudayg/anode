package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestCaddyRoutesIncludeParameterizedPaths(t *testing.T) {
	lock := &iag.LockFile{Services: map[string]iag.Service{
		"pricing": {Name: "pricing", Ingress: []iag.Ingress{{Protocol: "http", Routes: []string{"PUT /v1/pricing/{sku}", "GET /v1/pricing/{sku}"}}}},
	}}
	out := GenerateCaddyfile("example.com", lock, map[string]int{"pricing": 21061})
	if !strings.Contains(out, "handle /v1/pricing/* {") {
		t.Fatalf("a parameterized route must be served under its static prefix, got:\n%s", out)
	}
	if strings.Contains(out, "{sku}") {
		t.Fatalf("a route pattern must not be written into the Caddyfile, got:\n%s", out)
	}
}
