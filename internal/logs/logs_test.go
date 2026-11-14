package logs

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestParseJournaldJSON(t *testing.T) {
	// Sample line produced by journalctl -o json
	raw := `{"__REALTIME_TIMESTAMP":"1731580000123456","_SYSTEMD_UNIT":"anode-orders.service","_PID":"51820","PRIORITY":"6","MESSAGE":"Starting HTTP listener on 127.0.0.1:8080"}`

	entry, err := ParseJournaldJSON(raw)
	if err != nil {
		t.Fatalf("unexpected error parsing journald JSON: %v", err)
	}

	if entry.Service != "orders" {
		t.Errorf("expected Service=orders, got %q", entry.Service)
	}
	if entry.PID != 51820 {
		t.Errorf("expected PID=51820, got %d", entry.PID)
	}
	if entry.Priority != 6 {
		t.Errorf("expected Priority=6, got %d", entry.Priority)
	}
	if entry.Message != "Starting HTTP listener on 127.0.0.1:8080" {
		t.Errorf("expected correct message, got %q", entry.Message)
	}
	if entry.Timestamp.Unix() != 1731580000 {
		t.Errorf("expected correct timestamp Unix epoch, got %d", entry.Timestamp.Unix())
	}
}

func TestParseJournaldJSONCaddy(t *testing.T) {
	raw := `{"__REALTIME_TIMESTAMP":"1731580005000000","_SYSTEMD_UNIT":"caddy.service","_PID":"1200","MESSAGE":"certificate obtained successfully"}`

	entry, err := ParseJournaldJSON(raw)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if entry.Service != "caddy" {
		t.Errorf("expected Service=caddy, got %q", entry.Service)
	}
}

func TestParseJournaldJSONInvalid(t *testing.T) {
	_, err := ParseJournaldJSON("Not a JSON line")
	if err == nil {
		t.Error("expected error for non-json line")
	}
}

func TestParseLocalLogLine(t *testing.T) {
	line := "2026-11-14T10:15:30.123456789Z User checkout initiated: order_id=9871"
	entry := ParseLocalLogLine("checkout", line)

	if entry.Service != "checkout" {
		t.Errorf("expected Service=checkout, got %q", entry.Service)
	}
	if entry.Message != "User checkout initiated: order_id=9871" {
		t.Errorf("expected correct message, got %q", entry.Message)
	}
	if entry.Timestamp.Year() != 2026 || entry.Timestamp.Month() != 11 || entry.Timestamp.Day() != 14 {
		t.Errorf("expected correct date parsed, got %v", entry.Timestamp)
	}
}

func TestFormatLogLine(t *testing.T) {
	assigner := NewColorAssigner()
	ts, _ := time.Parse(time.RFC3339, "2026-11-14T10:00:00Z")
	entry := LogEntry{
		Timestamp: ts,
		Service:   "api",
		Message:   "Ready for connections",
	}

	// 1. Human standard
	var bufStd bytes.Buffer
	if err := FormatLogLine(&bufStd, entry, assigner, false, false); err != nil {
		t.Fatal(err)
	}
	outStd := bufStd.String()
	if !strings.Contains(outStd, "[api]") || !strings.Contains(outStd, "Ready for connections") {
		t.Errorf("expected formatted log line, got: %q", outStd)
	}
	if strings.Contains(outStd, "2026-11-14T") {
		t.Errorf("did not expect timestamp when showTimestamps=false")
	}

	// 2. Human with timestamps
	var bufTS bytes.Buffer
	if err := FormatLogLine(&bufTS, entry, assigner, true, false); err != nil {
		t.Fatal(err)
	}
	outTS := bufTS.String()
	if !strings.Contains(outTS, "2026-11-14T10:00:00Z") {
		t.Errorf("expected timestamp in output, got: %q", outTS)
	}

	// 3. JSON format
	var bufJSON bytes.Buffer
	if err := FormatLogLine(&bufJSON, entry, assigner, false, true); err != nil {
		t.Fatal(err)
	}
	var parsed LogEntry
	if err := json.Unmarshal(bufJSON.Bytes(), &parsed); err != nil {
		t.Fatalf("failed to unmarshal JSON log: %v", err)
	}
	if parsed.Service != "api" || parsed.Message != "Ready for connections" {
		t.Errorf("unexpected JSON payload: %+v", parsed)
	}
}

func TestBuildJournalctlCommand(t *testing.T) {
	units := []string{"anode-api.service", "anode-worker.service"}
	opts := Options{
		Follow:     true,
		Lines:      50,
		Since:      "15m",
		Until:      "1m",
		Timestamps: true,
	}

	cmd := buildJournalctlCommand(units, opts)
	expectedSubstrings := []string{
		"journalctl",
		"-u anode-api.service",
		"-u anode-worker.service",
		"-n 50",
		"-f",
		`--since="15m"`,
		`--until="1m"`,
		"-o json",
	}

	for _, sub := range expectedSubstrings {
		if !strings.Contains(cmd, sub) {
			t.Errorf("expected command to contain %q, got:\n%s", sub, cmd)
		}
	}
}

func TestStreamLocalSnapshotAndSorting(t *testing.T) {
	dir := t.TempDir()
	logDir := filepath.Join(dir, ".verify", "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		t.Fatal(err)
	}

	// Write simulated log entries in orders.log and billing.log with interleaved timestamps
	ordersLogs := `2026-11-14T10:00:01Z [orders] worker started
2026-11-14T10:00:03Z [orders] order received id=101
2026-11-14T10:00:05Z [orders] order processed id=101
`
	billingLogs := `2026-11-14T10:00:02Z [billing] payment gateway ready
2026-11-14T10:00:04Z [billing] charge authorized id=101
`
	if err := os.WriteFile(filepath.Join(logDir, "orders.log"), []byte(ordersLogs), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(logDir, "billing.log"), []byte(billingLogs), 0644); err != nil {
		t.Fatal(err)
	}

	var buf bytes.Buffer
	opts := Options{
		TargetDir:  dir,
		Lines:      10,
		Timestamps: true,
		Out:        &buf,
	}

	if err := StreamLocal(context.Background(), opts); err != nil {
		t.Fatalf("StreamLocal failed: %v", err)
	}

	output := buf.String()
	lines := strings.Split(strings.TrimSpace(output), "\n")
	if len(lines) != 5 {
		t.Fatalf("expected 5 merged lines, got %d:\n%s", len(lines), output)
	}

	// Verify chronological ordering across the two services
	if !strings.Contains(lines[0], "10:00:01") || !strings.Contains(lines[0], "orders") {
		t.Errorf("line 0 mismatch: %s", lines[0])
	}
	if !strings.Contains(lines[1], "10:00:02") || !strings.Contains(lines[1], "billing") {
		t.Errorf("line 1 mismatch: %s", lines[1])
	}
	if !strings.Contains(lines[2], "10:00:03") || !strings.Contains(lines[2], "orders") {
		t.Errorf("line 2 mismatch: %s", lines[2])
	}
	if !strings.Contains(lines[3], "10:00:04") || !strings.Contains(lines[3], "billing") {
		t.Errorf("line 3 mismatch: %s", lines[3])
	}
	if !strings.Contains(lines[4], "10:00:05") || !strings.Contains(lines[4], "orders") {
		t.Errorf("line 4 mismatch: %s", lines[4])
	}
}

func TestStreamLocalSingleServiceFilter(t *testing.T) {
	dir := t.TempDir()
	logDir := filepath.Join(dir, ".verify", "logs")
	_ = os.MkdirAll(logDir, 0755)

	_ = os.WriteFile(filepath.Join(logDir, "orders.log"), []byte("2026-11-14T10:00:01Z orders msg\n"), 0644)
	_ = os.WriteFile(filepath.Join(logDir, "billing.log"), []byte("2026-11-14T10:00:02Z billing msg\n"), 0644)

	var buf bytes.Buffer
	opts := Options{
		TargetDir: dir,
		Service:   "orders",
		Out:       &buf,
	}

	if err := StreamLocal(context.Background(), opts); err != nil {
		t.Fatalf("StreamLocal failed: %v", err)
	}

	out := buf.String()
	if !strings.Contains(out, "orders msg") {
		t.Errorf("expected orders msg, got: %s", out)
	}
	if strings.Contains(out, "billing msg") {
		t.Errorf("did not expect billing msg when filtering by orders: %s", out)
	}
}
