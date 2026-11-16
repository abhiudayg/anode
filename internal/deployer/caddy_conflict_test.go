package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func healthzLock() *iag.LockFile {
	return &iag.LockFile{
		Services: map[string]iag.Service{
			"payments": {Name: "payments", Ingress: []iag.Ingress{{Protocol: "http", Routes: []string{"GET /healthz"}}}},
			"orders":   {Name: "orders", Ingress: []iag.Ingress{{Protocol: "http", Routes: []string{"GET /healthz", "POST /v1/orders"}}}},
		},
	}
}

func TestCaddyConflictingPathsGetServicePrefixes(t *testing.T) {
	out := GenerateCaddyfile("api.example.com", healthzLock(), map[string]int{"orders": 21040, "payments": 21041})

	if !strings.Contains(out, "handle /healthz* {\n    reverse_proxy 127.0.0.1:21040") {
		t.Fatalf("the first service in name order must keep the bare path, got:\n%s", out)
	}
	if !strings.Contains(out, "handle /payments/healthz* {\n    uri strip_prefix /payments\n    reverse_proxy 127.0.0.1:21041") {
		t.Fatalf("the second service must be reachable under its own prefix, got:\n%s", out)
	}
	if strings.Count(out, "handle /healthz* {") != 1 {
		t.Fatalf("the bare path must be claimed once, got:\n%s", out)
	}
}

func TestCaddyOutputIsDeterministic(t *testing.T) {
	first := GenerateCaddyfile("api.example.com", healthzLock(), map[string]int{"orders": 21040, "payments": 21041})
	for i := 0; i < 50; i++ {
		if got := GenerateCaddyfile("api.example.com", healthzLock(), map[string]int{"orders": 21040, "payments": 21041}); got != first {
			t.Fatalf("run %d produced a different Caddyfile:\n%s\nvs\n%s", i, got, first)
		}
	}
}
