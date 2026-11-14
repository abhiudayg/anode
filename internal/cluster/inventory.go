package cluster

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Inventory represents the multi-node server inventory defined in anode.cluster.yaml.
type Inventory struct {
	Version string      `yaml:"version" json:"version"`
	Cluster ClusterMeta `yaml:"cluster" json:"cluster"`
	Nodes   []NodeSpec  `yaml:"nodes" json:"nodes"`
}

type ClusterMeta struct {
	Name    string       `yaml:"name" json:"name"`
	Network NetworkSpec  `yaml:"network" json:"network"`
	Cgroups CgroupsRules `yaml:"cgroups" json:"cgroups"`
}

type NetworkSpec struct {
	Subnet    string `yaml:"subnet" json:"subnet"`       // e.g. "10.100.0.0/16"
	Interface string `yaml:"interface" json:"interface"` // e.g. "wg0", "eth0"
}

type CgroupsRules struct {
	OvercommitRatio float64 `yaml:"overcommit_ratio" json:"overcommit_ratio"` // default 0.85
}

type NodeSpec struct {
	ID        string            `yaml:"id" json:"id"`
	Host      string            `yaml:"host" json:"host"`             // SSH user@host
	PrivateIP string            `yaml:"private_ip" json:"private_ip"` // IP within subnet
	Role      string            `yaml:"role" json:"role"`             // "edge", "worker", "storage", "hybrid"
	MemoryMB  int               `yaml:"memory_mb" json:"memory_mb"`   // Memory in MB
	CPUs      int               `yaml:"cpus,omitempty" json:"cpus,omitempty"`
	Labels    map[string]string `yaml:"labels,omitempty" json:"labels,omitempty"`
}

// LoadInventory reads and parses a cluster inventory file.
func LoadInventory(path string) (*Inventory, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("unable to read cluster inventory file at %s: %w", path, err)
	}

	var inv Inventory
	if err := yaml.Unmarshal(data, &inv); err != nil {
		return nil, fmt.Errorf("failed to parse cluster inventory YAML at %s: %w", path, err)
	}

	if len(inv.Nodes) == 0 {
		return nil, fmt.Errorf("cluster inventory at %s contains 0 nodes", path)
	}

	// Apply defaults
	if inv.Cluster.Name == "" {
		inv.Cluster.Name = "default-pool"
	}
	if inv.Cluster.Network.Subnet == "" {
		inv.Cluster.Network.Subnet = "10.100.0.0/16"
	}
	if inv.Cluster.Network.Interface == "" {
		inv.Cluster.Network.Interface = "wg0"
	}
	if inv.Cluster.Cgroups.OvercommitRatio <= 0 || inv.Cluster.Cgroups.OvercommitRatio > 1.0 {
		inv.Cluster.Cgroups.OvercommitRatio = 0.85
	}

	return &inv, nil
}

// FindInventory locates anode.cluster.yaml in targetDir or its parents.
func FindInventory(targetDir string) (string, error) {
	candidates := []string{
		filepath.Join(targetDir, "anode.cluster.yaml"),
		filepath.Join(targetDir, "anode.cluster.yml"),
		filepath.Join(targetDir, "cluster.yaml"),
		filepath.Join(targetDir, ".anode", "cluster.yaml"),
	}

	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c, nil
		}
	}

	return "", os.ErrNotExist
}

// DefaultInventoryTemplate produces an annotated starter template for anode cluster init.
func DefaultInventoryTemplate() string {
	return `# Anode Cluster Multi-Host Fleet Inventory (anode.cluster.yaml)
# Declares bare-metal/VPS nodes, private wireguard or VPC IPs, and resource capacities.

version: "1"
cluster:
  name: "production-pool"
  network:
    subnet: "10.100.0.0/16"         # Cluster private CIDR
    interface: "wg0"                # Inter-node WireGuard or private interface
  cgroups:
    overcommit_ratio: 0.85          # Allocate up to 85% of physical node RAM

nodes:
  - id: "edge-01"
    host: "root@192.168.1.10"       # SSH target for deployment & diagnosis
    private_ip: "10.100.0.10"       # Node private IP for zero-trust traffic
    role: "edge"                    # edge: receives public HTTP/HTTPS traffic
    memory_mb: 4096
    cpus: 4
    labels:
      zone: "us-east-1a"

  - id: "worker-01"
    host: "root@192.168.1.11"
    private_ip: "10.100.0.11"
    role: "worker"                  # worker: executes internal backend microservices
    memory_mb: 16384
    cpus: 8
    labels:
      zone: "us-east-1b"

  - id: "worker-02"
    host: "root@192.168.1.12"
    private_ip: "10.100.0.12"
    role: "worker"                  # worker: additional compute node
    memory_mb: 16384
    cpus: 8
    labels:
      zone: "us-east-1c"
`
}
