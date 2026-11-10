package cluster_test

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/cluster"
	"github.com/abhiudayg/anode/internal/iag"
)

func TestBinPacking(t *testing.T) {
	pool := cluster.NewClusterPool()
	pool.RegisterNode("node-1", "10.0.0.1", "worker", 4096)
	pool.RegisterNode("node-2", "10.0.0.2", "worker", 4096)

	services := map[string]iag.Service{
		"orders":   {Name: "orders"},
		"payments": {Name: "payments"},
		"auth":     {Name: "auth"},
	}

	placement, err := pool.BinPack(services)
	if err != nil {
		t.Fatalf("BinPack failed: %v", err)
	}

	if len(placement) != 3 {
		t.Errorf("expected 3 placements, got %d", len(placement))
	}

	if pool.Nodes["node-1"].Allocated+pool.Nodes["node-2"].Allocated != 3 {
		t.Errorf("unexpected total allocation")
	}
}

func TestZeroTrustFirewall(t *testing.T) {
	svc := iag.Service{Name: "orders"}
	rules := cluster.GenerateZeroTrustNftables(svc, []string{"10.0.0.5/32"})

	if !strings.Contains(rules, "chain output-orders") {
		t.Errorf("expected output chain for orders")
	}
	if !strings.Contains(rules, "ip daddr 10.0.0.5/32 accept") {
		t.Errorf("expected allowed subnet rule")
	}
}
