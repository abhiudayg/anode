package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestHealthRoutePathUsesFirstHTTPRoute(t *testing.T) {
	svc := iag.Service{Ingress: []iag.Ingress{{Protocol: "http", Routes: []string{"POST /v1/orders", "GET /v1/orders/{id}"}}}}
	got, err := healthRoutePath(svc)
	if err != nil || got != "/v1/orders" {
		t.Fatalf("healthRoutePath = %q, %v; want /v1/orders", got, err)
	}
}

func TestHealthRoutePathEmptyWithoutHTTPIngress(t *testing.T) {
	got, err := healthRoutePath(iag.Service{Ingress: []iag.Ingress{{Protocol: "grpc"}}})
	if err != nil || got != "" {
		t.Fatalf("worker service must have no health path, got %q, %v", got, err)
	}
}

func TestHealthRoutePathRejectsShellUnsafeRoute(t *testing.T) {
	svc := iag.Service{Ingress: []iag.Ingress{{Protocol: "http", Routes: []string{"GET /x;rm -rf /"}}}}
	if _, err := healthRoutePath(svc); err == nil {
		t.Fatalf("expected a route with shell characters to be rejected")
	}
}

func TestHTTPHealthCommandTargetsPortAndPathAndAcceptsNon5xx(t *testing.T) {
	cmd := httpHealthCommand(21040, "/v1/orders")
	for _, want := range []string{"127.0.0.1:21040/v1/orders", "-lt 500", "exit 1"} {
		if !strings.Contains(cmd, want) {
			t.Errorf("health command missing %q: %s", want, cmd)
		}
	}
}
