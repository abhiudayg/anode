package devengine

import (
	"context"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// WatchCallback receives one .go file that changed under the watched directory.
type WatchCallback func(changedFile string)

const (
	watchPollInterval = 300 * time.Millisecond
	watchDebounce     = 300 * time.Millisecond
)

// WatchDirectory polls the modification times of .go files under dir. A change is reported once the directory has
// been quiet for watchDebounce, so an editor's write-and-rename produces one callback. Hidden directories are skipped,
// which keeps the build output and logs under .verify out of the watch set.
func WatchDirectory(ctx context.Context, dir string, callback WatchCallback) {
	seen := snapshotGoFiles(dir)
	ticker := time.NewTicker(watchPollInterval)
	defer ticker.Stop()

	var pending string
	var pendingSince time.Time
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		now := snapshotGoFiles(dir)
		for path, mod := range now {
			if old, ok := seen[path]; !ok || !old.Equal(mod) {
				pending = path
				pendingSince = time.Now()
			}
		}
		for path := range seen {
			if _, ok := now[path]; !ok {
				pending = path
				pendingSince = time.Now()
			}
		}
		seen = now
		if pending != "" && time.Since(pendingSince) >= watchDebounce {
			callback(pending)
			pending = ""
		}
	}
}

// snapshotGoFiles maps every .go file under dir (except hidden directories) to its modification time.
func snapshotGoFiles(dir string) map[string]time.Time {
	files := make(map[string]time.Time)
	_ = filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			if path != dir && strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, ".go") {
			return nil
		}
		if info, err := os.Stat(path); err == nil {
			files[path] = info.ModTime()
		}
		return nil
	})
	return files
}
