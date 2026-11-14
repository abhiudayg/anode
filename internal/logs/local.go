package logs

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// StreamLocal reads and follows local logs created by the Anode dev engine in .verify/logs.
func StreamLocal(ctx context.Context, opts Options) error {
	out := opts.Out
	if out == nil {
		out = os.Stdout
	}

	targetDir := opts.TargetDir
	if targetDir == "" {
		targetDir = "."
	}

	logDir := filepath.Join(targetDir, ".verify", "logs")
	files, err := resolveLocalLogFiles(logDir, opts.Service)
	if err != nil || len(files) == 0 {
		return fmt.Errorf("no local logs found in %s (run 'anode dev' to start local services)", logDir)
	}

	linesLimit := opts.Lines
	if linesLimit <= 0 {
		linesLimit = 100
	}

	assigner := NewColorAssigner()

	// 1. Snapshot mode: Read and sort historical entries across all selected files
	var allEntries []LogEntry
	fileOffsets := make(map[string]int64)

	for svc, path := range files {
		entries, offset, err := readLastNLines(path, svc, linesLimit)
		if err == nil {
			allEntries = append(allEntries, entries...)
			fileOffsets[path] = offset
		}
	}

	// Sort chronologically
	sort.Slice(allEntries, func(i, j int) bool {
		return allEntries[i].Timestamp.Before(allEntries[j].Timestamp)
	})

	// Trim to requested linesLimit
	if len(allEntries) > linesLimit {
		allEntries = allEntries[len(allEntries)-linesLimit:]
	}

	for _, entry := range allEntries {
		if err := FormatLogLine(out, entry, assigner, opts.Timestamps, opts.JSON); err != nil {
			return err
		}
	}

	if !opts.Follow {
		return nil
	}

	// 2. Follow mode: Poll for new lines until context is cancelled
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			for svc, path := range files {
				newEntries, newOffset, err := readNewLines(path, svc, fileOffsets[path])
				if err == nil && len(newEntries) > 0 {
					fileOffsets[path] = newOffset
					for _, entry := range newEntries {
						if err := FormatLogLine(out, entry, assigner, opts.Timestamps, opts.JSON); err != nil {
							return err
						}
					}
				}
			}
		}
	}
}

func resolveLocalLogFiles(logDir string, filterService string) (map[string]string, error) {
	files := make(map[string]string)
	entries, err := os.ReadDir(logDir)
	if err != nil {
		return files, err
	}

	filter := strings.TrimSpace(filterService)
	if filter != "" {
		filter = strings.TrimPrefix(strings.TrimSuffix(filter, ".service"), "anode-")
	}

	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".log") {
			continue
		}
		svcName := strings.TrimSuffix(e.Name(), ".log")
		if filter != "" && svcName != filter {
			continue
		}
		files[svcName] = filepath.Join(logDir, e.Name())
	}

	return files, nil
}

func readLastNLines(path string, svc string, n int) ([]LogEntry, int64, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, 0, err
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return nil, 0, err
	}

	var lines []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	var entries []LogEntry
	start := 0
	if len(lines) > n {
		start = len(lines) - n
	}
	for i := start; i < len(lines); i++ {
		t := lines[i]
		if strings.TrimSpace(t) != "" {
			entries = append(entries, ParseLocalLogLine(svc, t))
		}
	}

	return entries, stat.Size(), nil
}

func readNewLines(path string, svc string, offset int64) ([]LogEntry, int64, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, offset, err
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		return nil, offset, err
	}

	if stat.Size() < offset {
		// File truncated / restarted
		offset = 0
	}

	if stat.Size() == offset {
		return nil, offset, nil
	}

	if _, err := f.Seek(offset, io.SeekStart); err != nil {
		return nil, offset, err
	}

	var entries []LogEntry
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		text := scanner.Text()
		if strings.TrimSpace(text) != "" {
			entries = append(entries, ParseLocalLogLine(svc, text))
		}
	}

	return entries, stat.Size(), nil
}
