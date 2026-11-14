package cluster

import (
	"fmt"
	"sort"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

// Node represents an individual server in the cluster pool.
type Node struct {
	ID                string            `json:"id"`
	Host              string            `json:"host"`
	PrivateIP         string            `json:"private_ip"`
	Role              string            `json:"role"` // "edge", "worker", "storage", "hybrid"
	MemoryMB          int               `json:"memory_mb"`
	CPUs              int               `json:"cpus"`
	Labels            map[string]string `json:"labels,omitempty"`
	Allocated         int               `json:"allocated_services"`
	AllocatedMemoryMB int               `json:"allocated_memory_mb"`
	NextPort          int               `json:"next_port"`
}

// EffectiveCapacity returns the assignable memory in MB considering the overcommit ratio.
func (n *Node) EffectiveCapacity(overcommitRatio float64) int {
	return int(float64(n.MemoryMB) * overcommitRatio)
}

// AvailableMemory returns unassigned memory in MB.
func (n *Node) AvailableMemory(overcommitRatio float64) int {
	avail := n.EffectiveCapacity(overcommitRatio) - n.AllocatedMemoryMB
	if avail < 0 {
		return 0
	}
	return avail
}

// Placement represents the computed assignment of a microservice to a cluster node.
type Placement struct {
	ServiceName string   `json:"service_name"`
	NodeID      string   `json:"node_id"`
	Host        string   `json:"host"`
	PrivateIP   string   `json:"private_ip"`
	Role        string   `json:"role"`
	MemoryMB    int      `json:"memory_mb"`
	Port        int      `json:"port"`
	HasIngress  bool     `json:"has_ingress"`
	Routes      []string `json:"routes,omitempty"`
}

// ClusterPool manages node capacities, placement strategies, and cluster metadata.
type ClusterPool struct {
	Name            string           `json:"name"`
	Network         NetworkSpec      `json:"network"`
	OvercommitRatio float64          `json:"overcommit_ratio"`
	Nodes           map[string]*Node `json:"nodes"`
	NodeOrder       []string         `json:"node_order"`
}

// NewClusterPool creates an empty cluster pool with sensible defaults.
func NewClusterPool() *ClusterPool {
	return &ClusterPool{
		Name:            "default-pool",
		OvercommitRatio: 0.85,
		Network: NetworkSpec{
			Subnet:    "10.100.0.0/16",
			Interface: "wg0",
		},
		Nodes: make(map[string]*Node),
	}
}

// NewClusterPoolFromInventory initializes a pool from a parsed inventory.
func NewClusterPoolFromInventory(inv *Inventory) *ClusterPool {
	pool := &ClusterPool{
		Name:            inv.Cluster.Name,
		Network:         inv.Cluster.Network,
		OvercommitRatio: inv.Cluster.Cgroups.OvercommitRatio,
		Nodes:           make(map[string]*Node),
	}

	for _, spec := range inv.Nodes {
		privateIP := spec.PrivateIP
		if privateIP == "" {
			// Extract host part from user@host
			privateIP = spec.Host
			if strings.Contains(privateIP, "@") {
				parts := strings.SplitN(privateIP, "@", 2)
				privateIP = parts[1]
			}
		}

		pool.RegisterNode(spec.ID, spec.Host, spec.Role, spec.MemoryMB)
		node := pool.Nodes[spec.ID]
		node.PrivateIP = privateIP
		node.CPUs = spec.CPUs
		node.Labels = spec.Labels
	}

	return pool
}

// RegisterNode adds or registers a node into the pool.
func (c *ClusterPool) RegisterNode(id, host, role string, memoryMB int) {
	if memoryMB <= 0 {
		memoryMB = 4096
	}
	if role == "" {
		role = "worker"
	}

	if _, exists := c.Nodes[id]; !exists {
		c.NodeOrder = append(c.NodeOrder, id)
	}

	c.Nodes[id] = &Node{
		ID:        id,
		Host:      host,
		PrivateIP: host,
		Role:      role,
		MemoryMB:  memoryMB,
		NextPort:  8080,
	}
}

// BinPackLockfile assigns all microservices defined in a lockfile across available cluster nodes.
func (c *ClusterPool) BinPackLockfile(lockfile *iag.LockFile) ([]Placement, error) {
	if len(c.Nodes) == 0 {
		return nil, fmt.Errorf("cannot bin-pack services: cluster pool has 0 nodes registered")
	}

	// Sort service names deterministically
	var serviceNames []string
	for name := range lockfile.Services {
		serviceNames = append(serviceNames, name)
	}
	sort.Strings(serviceNames)

	var placements []Placement

	for _, name := range serviceNames {
		svc := lockfile.Services[name]
		hasIngress := len(svc.Ingress) > 0

		var routes []string
		for _, ing := range svc.Ingress {
			routes = append(routes, ing.Routes...)
		}

		// Estimate memory weight (default: 256MB per Go microservice)
		serviceMemoryMB := 256

		// Select candidate node based on role preference and available memory
		candidate := c.selectBestNode(hasIngress, serviceMemoryMB)
		if candidate == nil {
			return nil, fmt.Errorf("insufficient cluster capacity to place service %q (requires %d MB)", name, serviceMemoryMB)
		}

		assignedPort := candidate.NextPort
		candidate.NextPort++
		candidate.Allocated++
		candidate.AllocatedMemoryMB += serviceMemoryMB

		placements = append(placements, Placement{
			ServiceName: name,
			NodeID:      candidate.ID,
			Host:        candidate.Host,
			PrivateIP:   candidate.PrivateIP,
			Role:        candidate.Role,
			MemoryMB:    serviceMemoryMB,
			Port:        assignedPort,
			HasIngress:  hasIngress,
			Routes:      routes,
		})
	}

	return placements, nil
}

// selectBestNode chooses the most suitable node matching role preference with highest residual memory.
func (c *ClusterPool) selectBestNode(hasIngress bool, requiredMemoryMB int) *Node {
	// First pass: try role-matched nodes
	var bestMatch *Node
	for _, id := range c.NodeOrder {
		node := c.Nodes[id]
		if node.AvailableMemory(c.OvercommitRatio) < requiredMemoryMB {
			continue
		}

		isRoleMatch := false
		if hasIngress && (node.Role == "edge" || node.Role == "hybrid") {
			isRoleMatch = true
		} else if !hasIngress && (node.Role == "worker" || node.Role == "hybrid") {
			isRoleMatch = true
		}

		if isRoleMatch {
			if bestMatch == nil || node.AvailableMemory(c.OvercommitRatio) > bestMatch.AvailableMemory(c.OvercommitRatio) {
				bestMatch = node
			}
		}
	}

	if bestMatch != nil {
		return bestMatch
	}

	// Fallback pass: any node with sufficient memory regardless of role
	var fallbackMatch *Node
	for _, id := range c.NodeOrder {
		node := c.Nodes[id]
		if node.AvailableMemory(c.OvercommitRatio) >= requiredMemoryMB {
			if fallbackMatch == nil || node.AvailableMemory(c.OvercommitRatio) > fallbackMatch.AvailableMemory(c.OvercommitRatio) {
				fallbackMatch = node
			}
		}
	}

	return fallbackMatch
}

// BinPack implements legacy map[string]iag.Service compatibility for unit tests.
func (c *ClusterPool) BinPack(services map[string]iag.Service) (map[string]string, error) {
	lockfile := &iag.LockFile{
		Services: services,
	}
	placements, err := c.BinPackLockfile(lockfile)
	if err != nil {
		return nil, err
	}

	res := make(map[string]string)
	for _, p := range placements {
		res[p.ServiceName] = p.NodeID
	}
	return res, nil
}
