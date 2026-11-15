package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func TestContainerSecretKeyNamesResource(t *testing.T) {
	if got := ContainerSecretKey("db-orders"); got != "DB_ORDERS_PASSWORD" {
		t.Fatalf("got %s", got)
	}
}

func TestDeployInputsRequireContainerPassword(t *testing.T) {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{
		"db-orders": {Kind: iag.ResourceKind("postgres"), AutoProvision: true},
	}}
	cfg := &projectconfig.File{Stores: map[string]projectconfig.Store{
		"db-orders": {Runtime: projectconfig.RuntimeDocker, Version: "16"},
	}}
	err := checkDeployInputs(lock, cfg, map[string]string{})
	if err == nil || !strings.Contains(err.Error(), "DB_ORDERS_PASSWORD") {
		t.Fatalf("missing container password must stop the deploy, got %v", err)
	}
	if err := checkDeployInputs(lock, cfg, map[string]string{"DB_ORDERS_PASSWORD": "pw"}); err != nil {
		t.Fatalf("present password must pass: %v", err)
	}
}
