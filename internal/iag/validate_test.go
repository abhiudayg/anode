package iag

import (
	"os"
	"path/filepath"
	"testing"
)

func TestIsValidIdentifier(t *testing.T) {
	valid := []string{"orders", "orders-db", "payment_service.v1", "redis-1", "app.prod"}
	for _, id := range valid {
		if !IsValidIdentifier(id) {
			t.Errorf("expected %q to be valid identifier", id)
		}
	}

	invalid := []string{
		"orders; rm -rf /",
		"orders && touch pwn",
		"orders|curl",
		"orders`whoami`",
		"orders$(id)",
		"../escape",
		"orders\nservice",
		"",
	}
	for _, id := range invalid {
		if IsValidIdentifier(id) {
			t.Errorf("expected %q to be rejected as invalid identifier", id)
		}
	}
}

func TestSafeResolvePath(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "anode-path-test-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	subDir := filepath.Join(tmpDir, "services", "api")
	_ = os.MkdirAll(subDir, 0755)

	// Valid subpath
	resolved, err := SafeResolvePath(tmpDir, "services/api")
	if err != nil {
		t.Errorf("unexpected error for valid subpath: %v", err)
	}
	if resolved != subDir {
		t.Errorf("resolved = %q; want %q", resolved, subDir)
	}

	// Path traversal attempts
	traversalPaths := []string{
		"../outside",
		"../../etc/passwd",
		"/etc/shadow",
		"services/../../..",
	}
	for _, p := range traversalPaths {
		_, err := SafeResolvePath(tmpDir, p)
		if err == nil {
			t.Errorf("expected path traversal error for %q, but got nil", p)
		}
	}
}
