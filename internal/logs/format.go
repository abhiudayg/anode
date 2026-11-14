package logs

import (
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"sync"
	"time"
)

var defaultColors = []string{
	"\033[36m", // Cyan
	"\033[32m", // Green
	"\033[33m", // Yellow
	"\033[35m", // Magenta
	"\033[34m", // Blue
	"\033[96m", // Bright Cyan
	"\033[92m", // Bright Green
	"\033[93m", // Bright Yellow
}

const colorReset = "\033[0m"
const colorGray = "\033[90m"

// ColorAssigner assigns a deterministic ANSI color to each service name.
type ColorAssigner struct {
	mu     sync.Mutex
	colors map[string]string
	next   int
}

// NewColorAssigner initializes a thread-safe service color mapper.
func NewColorAssigner() *ColorAssigner {
	return &ColorAssigner{
		colors: make(map[string]string),
	}
}

// GetColor returns the ANSI color code for a given service.
func (c *ColorAssigner) GetColor(service string) string {
	c.mu.Lock()
	defer c.mu.Unlock()
	if col, ok := c.colors[service]; ok {
		return col
	}
	col := defaultColors[c.next%len(defaultColors)]
	c.next++
	c.colors[service] = col
	return col
}

// FormatLogLine prints a formatted log line to the destination writer.
func FormatLogLine(w io.Writer, entry LogEntry, assigner *ColorAssigner, showTimestamps bool, isJSON bool) error {
	if isJSON {
		data, err := json.Marshal(entry)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintln(w, string(data))
		return err
	}

	color := assigner.GetColor(entry.Service)
	svcTag := fmt.Sprintf("%s[%s]%s", color, entry.Service, colorReset)

	if showTimestamps && !entry.Timestamp.IsZero() {
		tsStr := fmt.Sprintf("%s%s%s", colorGray, entry.Timestamp.Format(time.RFC3339), colorReset)
		_, err := fmt.Fprintf(w, "%-24s %s  %s\n", svcTag, tsStr, entry.Message)
		return err
	}

	_, err := fmt.Fprintf(w, "%-24s %s\n", svcTag, entry.Message)
	return err
}

// ParseJournaldJSON decodes a line produced by journalctl -o json.
func ParseJournaldJSON(line string) (*LogEntry, error) {
	line = strings.TrimSpace(line)
	if line == "" || !strings.HasPrefix(line, "{") {
		return nil, fmt.Errorf("not a json line")
	}

	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(line), &raw); err != nil {
		return nil, err
	}

	entry := &LogEntry{
		Raw: line,
	}

	// Message
	if msg, ok := raw["MESSAGE"].(string); ok {
		entry.Message = strings.TrimRight(msg, "\n")
	}

	// Service name from _SYSTEMD_UNIT
	unitStr := ""
	if u, ok := raw["_SYSTEMD_UNIT"].(string); ok {
		unitStr = u
	} else if u, ok := raw["UNIT"].(string); ok {
		unitStr = u
	}

	if unitStr != "" {
		if strings.HasPrefix(unitStr, "anode-") && strings.HasSuffix(unitStr, ".service") {
			entry.Service = strings.TrimPrefix(strings.TrimSuffix(unitStr, ".service"), "anode-")
		} else if strings.HasPrefix(unitStr, "caddy") {
			entry.Service = "caddy"
		} else {
			entry.Service = strings.TrimSuffix(unitStr, ".service")
		}
	} else if comm, ok := raw["_COMM"].(string); ok {
		entry.Service = comm
	} else {
		entry.Service = "system"
	}

	// Timestamp (__REALTIME_TIMESTAMP in microseconds)
	if tsStr, ok := raw["__REALTIME_TIMESTAMP"].(string); ok {
		if usec, err := strconv.ParseInt(tsStr, 10, 64); err == nil {
			entry.Timestamp = time.UnixMicro(usec)
		}
	} else if usec, ok := raw["__REALTIME_TIMESTAMP"].(float64); ok {
		entry.Timestamp = time.UnixMicro(int64(usec))
	}

	// PID
	if pidStr, ok := raw["_PID"].(string); ok {
		if pid, err := strconv.Atoi(pidStr); err == nil {
			entry.PID = pid
		}
	} else if pidVal, ok := raw["_PID"].(float64); ok {
		entry.PID = int(pidVal)
	}

	// Priority
	if pStr, ok := raw["PRIORITY"].(string); ok {
		if p, err := strconv.Atoi(pStr); err == nil {
			entry.Priority = p
		}
	}

	return entry, nil
}

// ParseLocalLogLine decodes a local log file line formatted with an RFC3339 timestamp.
func ParseLocalLogLine(service string, line string) LogEntry {
	trimmed := strings.TrimRight(line, "\r\n")
	parts := strings.SplitN(trimmed, " ", 2)
	if len(parts) == 2 {
		if t, err := time.Parse(time.RFC3339Nano, parts[0]); err == nil {
			return LogEntry{
				Timestamp: t,
				Service:   service,
				Message:   parts[1],
				Raw:       trimmed,
			}
		}
		if t, err := time.Parse(time.RFC3339, parts[0]); err == nil {
			return LogEntry{
				Timestamp: t,
				Service:   service,
				Message:   parts[1],
				Raw:       trimmed,
			}
		}
	}

	return LogEntry{
		Timestamp: time.Now(),
		Service:   service,
		Message:   trimmed,
		Raw:       trimmed,
	}
}
