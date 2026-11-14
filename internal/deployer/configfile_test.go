package deployer

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestBuildConfigDocumentNestsDottedKeys(t *testing.T) {
	raw, err := BuildConfigDocument(map[string]string{
		"database.dsn": "postgres://app@127.0.0.1/app",
		"redis.addr":   "127.0.0.1:6379",
	})
	if err != nil {
		t.Fatalf("BuildConfigDocument failed: %v", err)
	}
	var doc struct {
		Database struct {
			DSN string `json:"dsn"`
		} `json:"database"`
		Redis struct {
			Addr string `json:"addr"`
		} `json:"redis"`
	}
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatalf("document is not valid JSON: %v", err)
	}
	if doc.Database.DSN != "postgres://app@127.0.0.1/app" || doc.Redis.Addr != "127.0.0.1:6379" {
		t.Errorf("unexpected document: %s", raw)
	}
}

func TestBuildConfigDocumentRejectsConflictingKeys(t *testing.T) {
	_, err := BuildConfigDocument(map[string]string{
		"database":     "postgres://x",
		"database.dsn": "postgres://y",
	})
	if err == nil {
		t.Fatalf("expected a conflict error for overlapping keys")
	}
}

func TestDynamicUserNameFollowsUnitAndLimit(t *testing.T) {
	name, err := dynamicUserName("orders")
	if err != nil || name != "anode-orders" {
		t.Fatalf("dynamicUserName = %q, %v; want anode-orders", name, err)
	}
	if _, err := dynamicUserName(strings.Repeat("a", 30)); err == nil {
		t.Errorf("expected rejection for a name over the systemd user limit")
	}
}

func TestConfigHandoffCommandOwnsFileByServiceUser(t *testing.T) {
	cmd, err := configHandoffCommand("orders", "/etc/anode/env/1.orders.config.json", "config.json")
	if err != nil {
		t.Fatal(err)
	}
	want := "/usr/bin/install -m 0400 -o anode-orders -g anode-orders /etc/anode/env/1.orders.config.json /var/lib/orders/config.json"
	if cmd != want {
		t.Errorf("handoff command = %q, want %q", cmd, want)
	}
}
