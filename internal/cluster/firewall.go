package cluster

import (
	"fmt"
	"sort"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

// GenerateNodeFirewall synthesizes a complete, atomic Linux nftables configuration for a specific node.
func GenerateNodeFirewall(targetNodeID string, pool *ClusterPool, placements []Placement, lockfile *iag.LockFile) (string, error) {
	node, exists := pool.Nodes[targetNodeID]
	if !exists {
		return "", fmt.Errorf("node %q not found in cluster pool", targetNodeID)
	}

	var sb strings.Builder
	sb.WriteString("#!/usr/sbin/nft -f\n")
	sb.WriteString(fmt.Sprintf("# Anode Proof-of-Topology Zero-Trust Packet Filter for Node: %s (%s)\n", node.ID, node.PrivateIP))
	sb.WriteString(fmt.Sprintf("# Generated from lockfile contract across %d services\n\n", len(placements)))
	sb.WriteString("flush ruleset\n\n")

	sb.WriteString("table inet filter {\n")
	sb.WriteString("  chain input {\n")
	sb.WriteString("    type filter hook input priority filter; policy drop;\n\n")
	sb.WriteString("    # Fundamental loopback & stateful packet tracking\n")
	sb.WriteString("    iif \"lo\" accept comment \"Allow loopback\"\n")
	sb.WriteString("    ct state established,related accept comment \"Allow established/related connections\"\n")
	sb.WriteString("    ct state invalid drop comment \"Drop invalid TCP states\"\n\n")

	sb.WriteString("    # Administrative management & DNS\n")
	sb.WriteString("    tcp dport 22 accept comment \"Allow SSH administration\"\n")
	sb.WriteString("    udp dport 53 accept comment \"Allow DNS resolution\"\n\n")

	// If edge node, permit public web traffic
	if node.Role == "edge" || node.Role == "hybrid" {
		sb.WriteString("    # Public Edge Ingress (Let's Encrypt TLS & HTTP)\n")
		sb.WriteString("    tcp dport { 80, 443 } accept comment \"Allow public HTTP/HTTPS edge reverse-proxy\"\n\n")
	}

	// Services running on THIS node
	var localPlacements []Placement
	for _, p := range placements {
		if p.NodeID == targetNodeID {
			localPlacements = append(localPlacements, p)
		}
	}

	if len(localPlacements) > 0 {
		sb.WriteString("    # Microservice Zero-Trust Ports (Inter-Node Routing)\n")
		for _, p := range localPlacements {
			if p.HasIngress && (node.Role == "edge" || node.Role == "hybrid") {
				sb.WriteString(fmt.Sprintf("    tcp dport %d accept comment \"Ingress route for %s\"\n", p.Port, p.ServiceName))
			} else {
				// Only permit packets originating from trusted cluster nodes in subnet
				if pool.Network.Subnet != "" {
					sb.WriteString(fmt.Sprintf("    ip saddr %s tcp dport %d accept comment \"Allow cluster traffic to %s\"\n",
						pool.Network.Subnet, p.Port, p.ServiceName))
				} else {
					sb.WriteString(fmt.Sprintf("    tcp dport %d accept comment \"Internal port for %s\"\n", p.Port, p.ServiceName))
				}
			}
		}
		sb.WriteString("\n")
	}

	sb.WriteString("  }\n\n")

	sb.WriteString("  chain forward {\n")
	sb.WriteString("    type filter hook forward priority filter; policy drop;\n")
	sb.WriteString("  }\n\n")

	sb.WriteString("  chain output {\n")
	sb.WriteString("    type filter hook output priority filter; policy accept;\n")
	sb.WriteString("  }\n")
	sb.WriteString("}\n")

	return sb.String(), nil
}

// GenerateAllFirewalls returns synthesized nftables configurations for all nodes in the pool.
func GenerateAllFirewalls(pool *ClusterPool, placements []Placement, lockfile *iag.LockFile) (map[string]string, error) {
	result := make(map[string]string)
	for id := range pool.Nodes {
		rules, err := GenerateNodeFirewall(id, pool, placements, lockfile)
		if err != nil {
			return nil, err
		}
		result[id] = rules
	}
	return result, nil
}

// GenerateZeroTrustNftables implements legacy single-service rule synthesis for backward compatibility.
func GenerateZeroTrustNftables(svc iag.Service, allowedSubnets []string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# Zero-trust firewall rules for %s\n", svc.Name))
	sb.WriteString("table inet filter {\n")
	sb.WriteString(fmt.Sprintf("  chain output-%s {\n", svc.Name))
	sb.WriteString("    type filter hook output priority 0; policy drop;\n")
	sb.WriteString("    # Allow loopback & DNS\n")
	sb.WriteString("    oif \"lo\" accept\n")
	sb.WriteString("    ct state established,related accept\n")
	sb.WriteString("    udp dport 53 accept\n")

	sort.Strings(allowedSubnets)
	for _, subnet := range allowedSubnets {
		sb.WriteString(fmt.Sprintf("    ip daddr %s accept\n", subnet))
	}

	sb.WriteString("  }\n")
	sb.WriteString("}\n")
	return sb.String()
}
