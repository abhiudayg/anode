package deployer

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func lockWithRedis(autoProvision ...bool) *iag.LockFile {
	lock := &iag.LockFile{Resources: map[string]iag.Resource{}}
	for i, auto := range autoProvision {
		lock.Resources[string(rune('a'+i))+"-cache"] = iag.Resource{Kind: iag.ResourceKind("redis"), AutoProvision: auto}
	}
	return lock
}

func TestCheckRedisLimitAllowsOneNativeRedis(t *testing.T) {
	if err := CheckRedisLimit(lockWithRedis(true)); err != nil {
		t.Fatalf("one native Redis must be allowed: %v", err)
	}
}

func TestCheckRedisLimitRejectsTwoNativeRedis(t *testing.T) {
	err := CheckRedisLimit(lockWithRedis(true, true))
	if err == nil || !strings.Contains(err.Error(), "found 2") {
		t.Fatalf("two native Redis must be rejected with the count, got %v", err)
	}
}

func TestCheckRedisLimitIgnoresRedisNotAutoProvisioned(t *testing.T) {
	if err := CheckRedisLimit(lockWithRedis(true, false, false)); err != nil {
		t.Fatalf("Redis that is not auto-provisioned must not count toward the limit: %v", err)
	}
}
