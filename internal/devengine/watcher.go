package devengine

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type WatchCallback func(changedFile string)

// WatchDirectory polls file modification times with 300ms debounce
func WatchDirectory(ctx context.Context, dir string, callback WatchCallback) {
	fileModTimes := make(map[string]time.Time)

	// Initial scan
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() && strings.HasSuffix(path, ".go") && !strings.Contains(path, ".verify") {
			fileModTimes[path] = info.ModTime()
		}
		return nil
	})

	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
				if err == nil && !info.IsDir() && strings.HasSuffix(path, ".go") && !strings.Contains(path, ".verify") {
					lastMod, exists := fileModTimes[path]
					if !exists || info.ModTime().After(lastMod) {
						fileModTimes[path] = info.ModTime()
						if exists { // trigger only on change, not on initial index
							callback(path)
						}
					}
				}
				return nil
			})
		}
	}
}
