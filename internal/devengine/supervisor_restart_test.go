package devengine

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestRestartServiceKeepsRunningProcessWhenBuildFails(t *testing.T) {
	root := t.TempDir()
	entry := filepath.Join(root, "orders")
	if err := os.MkdirAll(entry, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(entry, "go.mod"), []byte("module orders\n\ngo 1.22\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(entry, "main.go"), []byte("package main\n\nfunc main() {\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	svc := iag.Service{Name: "orders", Entrypoint: "./orders"}
	lock := &iag.LockFile{Services: map[string]iag.Service{"orders": svc}}

	cancelled := false
	sup := NewSupervisor(root, lock)
	sup.instances["orders"] = &ServiceInstance{
		Name:       "orders",
		CancelFunc: func() { cancelled = true },
	}

	if err := sup.RestartService(context.Background(), "orders", nil); err == nil {
		t.Fatal("RestartService succeeded on a source tree that does not compile")
	}
	if cancelled {
		t.Fatal("running process was stopped although the new build failed")
	}
}
