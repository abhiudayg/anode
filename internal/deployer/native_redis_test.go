package deployer

import (
	"net/url"
	"strings"
	"testing"
)

func TestRedisPasswordKeyIsStableAcrossFolders(t *testing.T) {
	if got := RedisPasswordKey(); got != "REDIS_PASSWORD" {
		t.Errorf("RedisPasswordKey = %q, want REDIS_PASSWORD", got)
	}
}

func TestRedisUnitKeepsPasswordOutOfUnitFile(t *testing.T) {
	unit, err := redisUnit("redis-filebrowser-example", 6379)
	if err != nil {
		t.Fatalf("redisUnit failed: %v", err)
	}
	if !strings.Contains(unit, "EnvironmentFile=/etc/anode/redis-filebrowser-example.env") {
		t.Errorf("expected EnvironmentFile for the password, got:\n%s", unit)
	}
	if !strings.Contains(unit, "ExecStart=/usr/local/lib/anode/redis-start 6379 redis-filebrowser-example") {
		t.Errorf("expected ExecStart with port and state directory, got:\n%s", unit)
	}
	if strings.Contains(unit, "requirepass") {
		t.Errorf("password handling must not appear in the unit file")
	}
	if !strings.Contains(unit, "DynamicUser=yes") {
		t.Errorf("redis must run as a dynamic user")
	}
}

func TestRedisStartScriptReadsPasswordFromEnvironment(t *testing.T) {
	if !strings.Contains(redisStartScript, "$REDIS_PASSWORD") {
		t.Errorf("start script must read the password from the environment")
	}
	if !strings.Contains(redisStartScript, "exec /usr/bin/redis-server -") {
		t.Errorf("start script must feed the config to redis-server over stdin")
	}
	if !strings.Contains(redisStartScript, "bind 127.0.0.1") {
		t.Errorf("start script must bind to loopback only")
	}
}

func TestRedisConnectionURLEncodesPassword(t *testing.T) {
	password := "p@ss:w/rd#1"
	raw := RedisConnectionURL(password, 6379)
	parsed, err := url.Parse(raw)
	if err != nil {
		t.Fatalf("connection URL does not parse: %v", err)
	}
	if parsed.User == nil || parsed.User.String() == "" {
		t.Fatalf("no userinfo in %q", raw)
	}
	if got, _ := parsed.User.Password(); got != password {
		t.Errorf("password did not round-trip through %q", raw)
	}
	if parsed.Host != "127.0.0.1:6379" {
		t.Errorf("host = %q, want 127.0.0.1:6379", parsed.Host)
	}
}

func TestValidateRedisPasswordRejectsEmptyAndLineBreaks(t *testing.T) {
	for _, bad := range []string{"", "line\nbreak", "carriage\rreturn", "nul\x00byte"} {
		if err := validateRedisPassword(bad); err == nil {
			t.Errorf("expected rejection for %q", bad)
		}
	}
	if err := validateRedisPassword("ok-password"); err != nil {
		t.Errorf("valid password rejected: %v", err)
	}
}
