package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func lockWithRedis(runtimes ...string) (*iag.LockFile, *projectconfig.File) {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{}}
	cfg := &projectconfig.File{Stores: map[string]projectconfig.Store{}}
	for i, runtime := range runtimes {
		id := string(rune('a'+i)) + "-cache"
		lock.Resources[id] = iag.Resource{Kind: iag.ResourceKind("redis"), AutoProvision: true}
		cfg.Stores[id] = projectconfig.Store{Runtime: runtime}
	}
	return lock, cfg
}

func TestCheckRedisLimitAllowsOneNativeRedis(t *testing.T) {
	lock, cfg := lockWithRedis(projectconfig.RuntimeBinary)
	if err := CheckRedisLimit(lock, cfg); err != nil {
		t.Fatalf("one native Redis must be allowed: %v", err)
	}
}

func TestCheckRedisLimitRejectsTwoNativeRedis(t *testing.T) {
	lock, cfg := lockWithRedis(projectconfig.RuntimeBinary, projectconfig.RuntimeBinary)
	err := CheckRedisLimit(lock, cfg)
	if err == nil || !strings.Contains(err.Error(), "found 2") {
		t.Fatalf("two native Redis must be rejected with the count, got %v", err)
	}
}

func TestCheckRedisLimitAllowsRedisInContainers(t *testing.T) {
	lock, cfg := lockWithRedis(projectconfig.RuntimeBinary, projectconfig.RuntimeDocker, projectconfig.RuntimeDocker)
	if err := CheckRedisLimit(lock, cfg); err != nil {
		t.Fatalf("Redis in containers must not count toward the native limit: %v", err)
	}
}
