package projectconfig

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestExternalStoreNeedsNoVersionAndIsNotManaged(t *testing.T) {
	lock := &iag.LockFile{
		Resources: map[string]iag.Resource{"db-orders": {Kind: "postgres", AutoProvision: true}},
		Services:  map[string]iag.Service{},
	}
	f := &File{Stores: map[string]Store{"db-orders": {Runtime: RuntimeExternal}}}
	if err := f.Validate(lock); err != nil {
		t.Fatalf("an external store without a version must validate: %v", err)
	}
	if f.Managed("db-orders", lock.Resources["db-orders"]) {
		t.Fatalf("an external store must not be managed")
	}
}

func TestDockerStoreWithoutVersionStillFails(t *testing.T) {
	lock := &iag.LockFile{
		Resources: map[string]iag.Resource{"db-orders": {Kind: "postgres", AutoProvision: true}},
		Services:  map[string]iag.Service{},
	}
	f := &File{Stores: map[string]Store{"db-orders": {Runtime: RuntimeDocker}}}
	if err := f.Validate(lock); err == nil || !strings.Contains(err.Error(), "version is empty") {
		t.Fatalf("a docker store still needs a version, got %v", err)
	}
}
