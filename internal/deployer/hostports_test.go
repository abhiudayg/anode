package deployer

import (
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func TestContainerStoresGetDistinctHostPorts(t *testing.T) {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{
		"db-b":  {Kind: "postgres", AutoProvision: true},
		"db-a":  {Kind: "postgres", AutoProvision: true},
		"cache": {Kind: "redis", AutoProvision: true},
		"local": {Kind: "postgres", AutoProvision: false},
	}}
	cfg := &projectconfig.File{Stores: map[string]projectconfig.Store{
		"db-b":  {Runtime: projectconfig.RuntimeDocker},
		"db-a":  {Runtime: projectconfig.RuntimeDocker},
		"cache": {Runtime: projectconfig.RuntimeBinary},
	}}
	ports := containerHostPorts(lock, cfg)
	if len(ports) != 2 || ports["db-a"] == ports["db-b"] {
		t.Fatalf("two container stores need two ports, got %v", ports)
	}
	if ports["db-a"] != containerHostPortBase {
		t.Fatalf("ports are assigned in resource-name order, db-a should be %d, got %v", containerHostPortBase, ports)
	}
	if _, ok := ports["cache"]; ok {
		t.Fatalf("a native store must not get a container port")
	}
}
