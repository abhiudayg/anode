package cluster_test

import (
	"os"
	"path/filepath"
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

func TestBinPackingEdgeVsWorker(t *testing.T) {
	pool := cluster.NewClusterPool()
	pool.RegisterNode("edge-1", "10.0.0.1", "edge", 2048)
	pool.RegisterNode("worker-1", "10.0.0.2", "worker", 8192)

	services := map[string]iag.Service{
		"api-gateway": {
			Name: "api-gateway",
			Ingress: []iag.Ingress{
				{Protocol: "http", Routes: []string{"GET /"}},
			},
		},
		"backend-worker": {
			Name: "backend-worker",
		},
	}

	placement, err := pool.BinPack(services)
	if err != nil {
		t.Fatalf("BinPack failed: %v", err)
	}

	if len(placement) != 2 {
		t.Errorf("expected 2 placed services")
	}

	if placement["api-gateway"] != "edge-1" {
		t.Errorf("expected api-gateway on edge-1, got %s", placement["api-gateway"])
	}
	if placement["backend-worker"] != "worker-1" {
		t.Errorf("expected backend-worker on worker-1, got %s", placement["backend-worker"])
	}
}

func TestInventoryLoadAndTemplate(t *testing.T) {
	tmpDir := t.TempDir()
	invPath := filepath.Join(tmpDir, "anode.cluster.yaml")
	template := cluster.DefaultInventoryTemplate()

	if err := os.WriteFile(invPath, []byte(template), 0644); err != nil {
		t.Fatalf("failed to write template: %v", err)
	}

	inv, err := cluster.LoadInventory(invPath)
	if err != nil {
		t.Fatalf("LoadInventory failed: %v", err)
	}

	if inv.Cluster.Name != "production-pool" {
		t.Errorf("expected cluster name production-pool, got %s", inv.Cluster.Name)
	}
	if len(inv.Nodes) != 3 {
		t.Errorf("expected 3 nodes, got %d", len(inv.Nodes))
	}

	found, err := cluster.FindInventory(tmpDir)
	if err != nil || found != invPath {
		t.Errorf("FindInventory failed to locate %s: %v", invPath, err)
	}
}

func TestLockfilePlacementAndFirewall(t *testing.T) {
	inv := &cluster.Inventory{
		Cluster: cluster.ClusterMeta{
			Name: "test-pool",
			Network: cluster.NetworkSpec{
				Subnet:    "10.100.0.0/16",
				Interface: "wg0",
			},
			Cgroups: cluster.CgroupsRules{
				OvercommitRatio: 0.85,
			},
		},
		Nodes: []cluster.NodeSpec{
			{ID: "edge-1", Host: "root@192.168.1.10", PrivateIP: "10.100.0.10", Role: "edge", MemoryMB: 4096},
			{ID: "worker-1", Host: "root@192.168.1.11", PrivateIP: "10.100.0.11", Role: "worker", MemoryMB: 8192},
		},
	}

	lockfile := &iag.LockFile{
		Services: map[string]iag.Service{
			"web-api": {
				Name: "web-api",
				Ingress: []iag.Ingress{
					{Protocol: "http", Routes: []string{"GET /api/v1"}},
				},
			},
			"auth-service": {
				Name: "auth-service",
			},
		},
	}

	pool := cluster.NewClusterPoolFromInventory(inv)
	placements, err := pool.BinPackLockfile(lockfile)
	if err != nil {
		t.Fatalf("BinPackLockfile failed: %v", err)
	}

	if len(placements) != 2 {
		t.Fatalf("expected 2 placements, got %d", len(placements))
	}

	// Verify table formatting
	table := cluster.FormatPlacementTable(inv, placements, pool)
	if !strings.Contains(table, "web-api") || !strings.Contains(table, "auth-service") {
		t.Errorf("expected table to contain services, got:\n%s", table)
	}
	if !strings.Contains(table, "edge-1") || !strings.Contains(table, "worker-1") {
		t.Errorf("expected table to contain nodes, got:\n%s", table)
	}

	// Verify firewall generation
	rules, err := cluster.GenerateAllFirewalls(pool, placements, lockfile)
	if err != nil {
		t.Fatalf("GenerateAllFirewalls failed: %v", err)
	}

	edgeRules, ok := rules["edge-1"]
	if !ok || !strings.Contains(edgeRules, "tcp dport { 80, 443 } accept") {
		t.Errorf("expected public edge ingress rule in edge-1 firewall, got:\n%s", edgeRules)
	}

	workerRules, ok := rules["worker-1"]
	if !ok || !strings.Contains(workerRules, "10.100.0.0/16") {
		t.Errorf("expected cluster subnet restriction in worker-1 firewall, got:\n%s", workerRules)
	}

	// Verify JSON format
	jsonOut, err := cluster.FormatJSON(placements)
	if err != nil {
		t.Fatalf("FormatJSON failed: %v", err)
	}
	if !strings.Contains(jsonOut, `"service_name": "web-api"`) {
		t.Errorf("expected JSON to contain service name, got:\n%s", jsonOut)
	}
}

func TestLegacyZeroTrustFirewall(t *testing.T) {
	svc := iag.Service{Name: "orders"}
	rules := cluster.GenerateZeroTrustNftables(svc, []string{"10.0.0.5/32"})

	if !strings.Contains(rules, "chain output-orders") {
		t.Errorf("expected output chain for orders")
	}
	if !strings.Contains(rules, "ip daddr 10.0.0.5/32 accept") {
		t.Errorf("expected allowed subnet rule")
	}
	if !strings.Contains(rules, "drop") {
		t.Errorf("expected default drop policy in zero-trust rules")
	}
}
