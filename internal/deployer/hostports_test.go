package deployer

import (
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func TestContainerStoresGetDistinctHostPortsInNameOrder(t *testing.T) {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{
		"db-b":  {Kind: "postgres", AutoProvision: true},
		"db-a":  {Kind: "postgres", AutoProvision: true},
		"cache": {Kind: "redis", AutoProvision: true},
	}}
	cfg := &projectconfig.File{Stores: map[string]projectconfig.Store{
		"db-b":  {Runtime: projectconfig.RuntimeDocker},
		"db-a":  {Runtime: projectconfig.RuntimeDocker},
		"cache": {Runtime: projectconfig.RuntimeBinary},
	}}
	state := State{HostPorts: map[string]int{}}
	ports := containerHostPorts(lock, cfg, &state)
	if len(ports) != 2 || ports["db-a"] == ports["db-b"] {
		t.Fatalf("two container stores need two ports, got %v", ports)
	}
	if ports["db-a"] != containerHostPortBase {
		t.Fatalf("ports are assigned in resource-name order, db-a should be %d, got %v", containerHostPortBase, ports)
	}
	if _, ok := ports["cache"]; ok {
		t.Fatalf("a native store must not get a container port")
	}
	if state.HostPorts["db-a"] != ports["db-a"] {
		t.Fatalf("assigned ports must be recorded in the state file")
	}
}

func TestRecordedHostPortIsKeptWhenStoresChange(t *testing.T) {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{
		"warehouse-rabbitmq": {Kind: "rabbitmq", AutoProvision: true},
		"email-rabbitmq":     {Kind: "rabbitmq", AutoProvision: true},
	}}
	cfg := &projectconfig.File{Stores: map[string]projectconfig.Store{
		"warehouse-rabbitmq": {Runtime: projectconfig.RuntimeDocker},
		"email-rabbitmq":     {Runtime: projectconfig.RuntimeDocker},
	}}
	state := State{HostPorts: map[string]int{"warehouse-rabbitmq": 31007}}
	ports := containerHostPorts(lock, cfg, &state)
	if ports["warehouse-rabbitmq"] != 31007 {
		t.Fatalf("a recorded host port must not change, got %v", ports)
	}
	if ports["email-rabbitmq"] == 31007 {
		t.Fatalf("a new store must not reuse a recorded port, got %v", ports)
	}
}
