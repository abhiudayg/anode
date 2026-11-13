package cluster

import (
	"fmt"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

type Node struct {
	ID        string `json:"id"`
	Host      string `json:"host"`
	Role      string `json:"role"` // "worker", "storage", "edge"
	MemoryMB  int    `json:"memory_mb"`
	Allocated int    `json:"allocated_services"`
}

type ClusterPool struct {
	Nodes map[string]*Node `json:"nodes"`
}

func NewClusterPool() *ClusterPool {
	return &ClusterPool{
		Nodes: make(map[string]*Node),
	}
}

func (c *ClusterPool) RegisterNode(id, host, role string, memoryMB int) {
	c.Nodes[id] = &Node{
		ID:       id,
		Host:     host,
		Role:     role,
		MemoryMB: memoryMB,
	}
}

// BinPack assigns services to the least loaded available worker node
func (c *ClusterPool) BinPack(services map[string]iag.Service) (map[string]string, error) {
	placement := make(map[string]string)

	for name := range services {
		var bestNode *Node
		for _, node := range c.Nodes {
			if node.Role == "worker" || node.Role == "edge" {
				if bestNode == nil || node.Allocated < bestNode.Allocated {
					bestNode = node
				}
			}
		}

		if bestNode == nil {
			return nil, fmt.Errorf("no suitable node found in cluster to place service %s", name)
		}

		placement[name] = bestNode.ID
		bestNode.Allocated++
	}

	return placement, nil
}

// GenerateZeroTrustNftables emits Linux nftables rules based strictly on IAG bindings
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

	for _, subnet := range allowedSubnets {
		sb.WriteString(fmt.Sprintf("    ip daddr %s accept\n", subnet))
	}

	sb.WriteString("  }\n")
	sb.WriteString("}\n")
	return sb.String()
}
