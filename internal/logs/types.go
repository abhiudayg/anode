package logs

import (
	"io"
	"time"
)

// Options holds configuration for log inspection and streaming.
type Options struct {
	Target      string    // Remote VPS <user@host>, or empty for local
	TargetDir   string    // Local working directory (defaults to ".")
	Service     string    // Specific service to filter by, or empty for all
	Follow      bool      // -f, --follow log output
	Lines       int       // -n, --lines, --tail (default: 100)
	Since       string    // --since (e.g. "10m", "1h", "2026-11-14 10:00:00")
	Until       string    // --until
	Timestamps  bool      // -t, --timestamps (show timestamps)
	IncludeEdge bool      // --edge (include Caddy reverse-proxy logs)
	JSON        bool      // --json output structured log entries
	Out         io.Writer // Destination writer (defaults to os.Stdout)
}

// LogEntry represents a single normalized log line.
type LogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
	PID       int       `json:"pid,omitempty"`
	Message   string    `json:"message"`
	Priority  int       `json:"priority,omitempty"` // 0-7 syslog priority
	Raw       string    `json:"raw,omitempty"`
}
