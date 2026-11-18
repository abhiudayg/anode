package devengine

import (
	"context"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func startWatch(t *testing.T, dir string) <-chan string {
	t.Helper()
	changes := make(chan string, 16)
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	go WatchDirectory(ctx, dir, func(changed string) { changes <- changed })
	time.Sleep(2 * watchPollInterval)
	return changes
}

func awaitChange(t *testing.T, changes <-chan string) string {
	t.Helper()
	select {
	case got := <-changes:
		return got
	case <-time.After(3 * time.Second):
		t.Fatal("no change reported within 3s")
		return ""
	}
}

func TestWatchDirectoryReportsEditedGoFileOnce(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "handler.go")
	if err := os.WriteFile(file, []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	changes := startWatch(t, dir)

	if err := os.WriteFile(file, []byte("package main\n// edited\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if got := awaitChange(t, changes); got != file {
		t.Fatalf("changed file = %q, want %q", got, file)
	}
	select {
	case extra := <-changes:
		t.Fatalf("one edit reported twice: %q", extra)
	case <-time.After(3 * watchDebounce):
	}
}

func TestWatchDirectoryIgnoresHiddenDirectoriesAndNonGoFiles(t *testing.T) {
	dir := t.TempDir()
	hidden := filepath.Join(dir, ".verify")
	if err := os.MkdirAll(hidden, 0o755); err != nil {
		t.Fatal(err)
	}
	changes := startWatch(t, dir)

	if err := os.WriteFile(filepath.Join(hidden, "build.go"), []byte("package main\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	select {
	case got := <-changes:
		t.Fatalf("reported %q, expected hidden dir and non-Go files to be ignored", got)
	case <-time.After(3 * time.Second):
	}
}
