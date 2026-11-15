package deployer

import (
	"context"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func lockWithName(res iag.Resource, svc iag.Service) *iag.LockFile {
	return &iag.LockFile{
		Resources: map[string]iag.Resource{"store": res},
		Services:  map[string]iag.Service{"app": svc},
	}
}

func TestDeployPreflightRejectsNamesThatWouldBreakTheShell(t *testing.T) {
	cases := map[string]*iag.LockFile{
		"topic with a quote":           lockWithName(iag.Resource{Kind: "kafka", Topics: []string{"orders'; rm -rf /; '"}}, iag.Service{}),
		"bucket with a space":          lockWithName(iag.Resource{Kind: "minio", Buckets: []string{"my bucket"}}, iag.Service{}),
		"collection with a quote":      lockWithName(iag.Resource{Kind: "qdrant", Collections: []iag.Collection{{Name: "products'", VectorSize: 4}}}, iag.Service{}),
		"distance with a quote":        lockWithName(iag.Resource{Kind: "qdrant", Collections: []iag.Collection{{Name: "products", VectorSize: 4, Distance: "Cosine'; x"}}}, iag.Service{}),
		"env name with a newline":      lockWithName(iag.Resource{Kind: "postgres"}, iag.Service{ConfigEnv: []string{"PORT\nExecStartPre=/bin/sh"}}),
		"secret env name with a space": lockWithName(iag.Resource{Kind: "postgres"}, iag.Service{Secrets: []iag.SecretRef{{EnvVar: "DB PASSWORD"}}}),
	}
	for name, lock := range cases {
		if err := checkDeployInputs(lock, &projectconfig.File{}, map[string]string{}); err == nil {
			t.Errorf("%s must be rejected before any host is touched", name)
		}
	}
}

func TestDeployPreflightAcceptsTheNamesTheMarketplaceUses(t *testing.T) {
	lock := &iag.LockFile{
		Resources: map[string]iag.Resource{
			"shipping-kafka": {Kind: "kafka", Topics: []string{"shipments.created"}},
			"cms-minio":      {Kind: "minio", Buckets: []string{"cms-assets"}},
			"search-qdrant":  {Kind: "qdrant", Collections: []iag.Collection{{Name: "products", VectorSize: 4, Distance: "Cosine"}}},
		},
		Services: map[string]iag.Service{
			"orders": {ConfigEnv: []string{"PORT", "ORDERS_DB_URL"}, Secrets: []iag.SecretRef{{EnvVar: "STRIPE_SECRET_KEY"}}},
		},
	}
	if err := checkLockNames(lock); err != nil {
		t.Fatalf("valid names must pass: %v", err)
	}
}

func TestDeployRejectsADomainThatWouldBreakTheCaddyfileBeforeAnyCommand(t *testing.T) {
	host := &scriptedHost{answer: func(string) (string, error) { return "", nil }}
	lock := &iag.LockFile{Services: map[string]iag.Service{}, Resources: map[string]iag.Resource{}}
	err := NewDeployCoordinator(t.TempDir(), host, lock).Deploy(context.Background(), "shop.example.com {\nimport evil")
	if err == nil || !strings.Contains(err.Error(), "domain") {
		t.Fatalf("a domain with braces or spaces must be rejected, got %v", err)
	}
	if len(host.commands) != 0 {
		t.Fatalf("no remote command may run for a rejected domain, ran %v", host.commands)
	}
}

func TestRoutePathsThatWouldReshapeTheCaddyfileAreRejected(t *testing.T) {
	for _, route := range []string{"GET /v1/x respond 200", "GET /v1/x\"", "GET /v1/x(evil)", "/v1/a b"} {
		if err := checkRoutePath(route); err == nil {
			t.Errorf("route %q must be rejected", route)
		}
	}
	for _, route := range []string{"POST /v1/orders", "GET /v1/pricing/{id}", "GET /healthz"} {
		if err := checkRoutePath(route); err != nil {
			t.Errorf("route %q must pass: %v", route, err)
		}
	}
}
