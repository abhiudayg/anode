package cluster

import (
	"encoding/json"
	"fmt"
	"strings"
)

// FormatPlacementTable renders human-readable node capacity and service placement tables.
func FormatPlacementTable(inv *Inventory, placements []Placement, pool *ClusterPool) string {
	var sb strings.Builder

	clusterName := pool.Name
	if clusterName == "" {
		clusterName = "default-pool"
	}

	sb.WriteString(fmt.Sprintf("🌐 Anode Cluster Multi-Host Pool: %s (%d nodes registered)\n", clusterName, len(pool.Nodes)))
	sb.WriteString(fmt.Sprintf("Private Subnet: %s (interface: %s)\n", pool.Network.Subnet, pool.Network.Interface))
	sb.WriteString(fmt.Sprintf("Cgroups v2 Safety Margin: %.0f%% RAM headroom\n\n", (1.0-pool.OvercommitRatio)*100))

	// Table 1: Node Fleet & Capacity
	sb.WriteString("[NODE FLEET & CAPACITY]\n")
	sb.WriteString(fmt.Sprintf("%-12s | %-8s | %-16s | %-20s | %-12s | %-8s | %s\n",
		"NODE ID", "ROLE", "PRIVATE IP", "HOST (SSH)", "RAM CAPACITY", "SERVICES", "UTILIZATION"))
	sb.WriteString(strings.Repeat("─", 98) + "\n")

	for _, id := range pool.NodeOrder {
		node := pool.Nodes[id]
		effCap := node.EffectiveCapacity(pool.OvercommitRatio)
		utilPct := 0.0
		if effCap > 0 {
			utilPct = (float64(node.AllocatedMemoryMB) / float64(effCap)) * 100
		}

		sb.WriteString(fmt.Sprintf("%-12s | %-8s | %-16s | %-20s | %-12s | %-8d | %.1f%%\n",
			node.ID,
			node.Role,
			node.PrivateIP,
			node.Host,
			fmt.Sprintf("%d MB", node.MemoryMB),
			node.Allocated,
			utilPct,
		))
	}
	sb.WriteString("\n")

	// Table 2: Service Placement Matrix
	sb.WriteString("[SERVICE PLACEMENT MATRIX]\n")
	sb.WriteString(fmt.Sprintf("%-18s | %-12s | %-8s | %-16s | %-24s | %s\n",
		"SERVICE", "ASSIGNED NODE", "ROLE", "PRIVATE IP", "PORT / INGRESS", "MEMORY LIMIT"))
	sb.WriteString(strings.Repeat("─", 98) + "\n")

	for _, p := range placements {
		ingressDesc := fmt.Sprintf(":%d (Internal)", p.Port)
		if p.HasIngress && len(p.Routes) > 0 {
			ingressDesc = fmt.Sprintf(":%d (%s)", p.Port, p.Routes[0])
			if len(p.Routes) > 1 {
				ingressDesc = fmt.Sprintf(":%d (%s +%d)", p.Port, p.Routes[0], len(p.Routes)-1)
			}
		} else if p.HasIngress {
			ingressDesc = fmt.Sprintf(":%d (Public Ingress)", p.Port)
		}

		sb.WriteString(fmt.Sprintf("%-18s | %-12s | %-8s | %-16s | %-24s | %s\n",
			p.ServiceName,
			p.NodeID,
			p.Role,
			p.PrivateIP,
			ingressDesc,
			fmt.Sprintf("%d MB", p.MemoryMB),
		))
	}

	return sb.String()
}

// FormatFirewallSummary renders a clean summary of generated nftables rules for all nodes.
func FormatFirewallSummary(rules map[string]string) string {
	var sb strings.Builder
	sb.WriteString("🛡️ Anode Zero-Trust Linux nftables Packet Filter Rules\n")
	sb.WriteString(strings.Repeat("─", 80) + "\n\n")

	for nodeID, conf := range rules {
		sb.WriteString(fmt.Sprintf("=== [Node: %s] ===\n", nodeID))
		sb.WriteString(conf)
		sb.WriteString("\n")
	}

	return sb.String()
}

// FormatJSON serializes any cluster structure to indented JSON.
func FormatJSON(v interface{}) (string, error) {
	bytes, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
