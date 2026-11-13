package ps

import (
	"bytes"
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		bytes    uint64
		expected string
	}{
		{500, "500 B"},
		{1024, "1.0 KB"},
		{1024 * 1024, "1.0 MB"},
		{25 * 1024 * 1024, "25.0 MB"},
		{1024 * 1024 * 1024, "1.0 GB"},
	}

	for _, tt := range tests {
		got := FormatBytes(tt.bytes)
		if got != tt.expected {
			t.Errorf("FormatBytes(%d) = %q; want %q", tt.bytes, got, tt.expected)
		}
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		dur      time.Duration
		expected string
	}{
		{15 * time.Second, "15s"},
		{5*time.Minute + 12*time.Second, "5m 12s"},
		{3*time.Hour + 20*time.Minute, "3h 20m"},
		{2*24*time.Hour + 4*time.Hour, "2d 4h"},
	}

	for _, tt := range tests {
		got := FormatDuration(tt.dur)
		if got != tt.expected {
			t.Errorf("FormatDuration(%v) = %q; want %q", tt.dur, got, tt.expected)
		}
	}
}

func TestClassifyState(t *testing.T) {
	// 1. Running normally
	if got := classifyState("active", "running", 0, 0); got != StateRunning {
		t.Errorf("expected StateRunning, got %s", got)
	}

	// 2. Auto-restarting
	if got := classifyState("active", "auto-restart", 1, 0); got != StateRestarting {
		t.Errorf("expected StateRestarting, got %s", got)
	}

	// 3. Failed with crash restarts -> CrashLoop
	if got := classifyState("failed", "failed", 5, 2); got != StateCrashLoop {
		t.Errorf("expected StateCrashLoop, got %s", got)
	}

	// 4. Repeated auto-restart (>3 restarts) -> CrashLoop
	if got := classifyState("inactive", "auto-restart", 4, 1); got != StateCrashLoop {
		t.Errorf("expected StateCrashLoop, got %s", got)
	}

	// 5. Inactive / stopped
	if got := classifyState("inactive", "dead", 0, 0); got != StateInactive {
		t.Errorf("expected StateInactive, got %s", got)
	}
}

func TestParseSystemdProperties(t *testing.T) {
	raw := `Id=anode-orders.service
ActiveState=active
SubState=running
MainPID=48102
TasksCurrent=14
MemoryCurrent=33554432
NRestarts=0
ExecMainStatus=0
Environment=PORT=21041 DATABASE_URL=postgres://...
`
	props := parseSystemdProperties(raw)
	if props["Id"] != "anode-orders.service" {
		t.Errorf("expected Id anode-orders.service, got %q", props["Id"])
	}
	if props["MainPID"] != "48102" {
		t.Errorf("expected MainPID 48102, got %q", props["MainPID"])
	}
	if props["MemoryCurrent"] != "33554432" {
		t.Errorf("expected MemoryCurrent 33554432, got %q", props["MemoryCurrent"])
	}
}

func TestParseCaddyfile(t *testing.T) {
	caddyfile := `shop.anode.dev {
    reverse_proxy /api/orders* 127.0.0.1:21041
    reverse_proxy /api/auth* 127.0.0.1:21040
    reverse_proxy 127.0.0.1:21040
}
`
	edge := &EdgeStatus{
		RouteRules: make(map[string]string),
	}
	parseCaddyfile(caddyfile, edge)

	if edge.Domain != "shop.anode.dev" {
		t.Errorf("expected domain shop.anode.dev, got %q", edge.Domain)
	}
	if !edge.TLSActive {
		t.Errorf("expected TLSActive=true for shop.anode.dev")
	}
	if edge.RouteRules["/api/orders*"] != "127.0.0.1:21041" {
		t.Errorf("expected /api/orders* -> 127.0.0.1:21041, got %v", edge.RouteRules["/api/orders*"])
	}
}

func TestCalculateUptime(t *testing.T) {
	// Test stopped
	dur, human := calculateUptime("[not set]", "", StateInactive)
	if dur != 0 || human != "stopped" {
		t.Errorf("expected 0, 'stopped', got %v, %q", dur, human)
	}

	// Test valid recent timestamp
	recent := time.Now().Add(-10 * time.Minute).UTC().Format("Mon 2006-01-02 15:04:05 MST")
	dur, human = calculateUptime(recent, "", StateRunning)
	if dur < 9*time.Minute || dur > 11*time.Minute {
		t.Errorf("expected ~10m duration, got %v", dur)
	}
	if !strings.Contains(human, "10m") && !strings.Contains(human, "9m") {
		t.Errorf("expected human format containing minutes, got %q", human)
	}
}

func TestPrintJSONReport(t *testing.T) {
	rep := &ProcessReport{
		Target:      "root@10.0.0.5",
		IsRemote:    true,
		ReleaseID:   "1710349200",
		CgroupsMode: "v2 (unified)",
		Timestamp:   time.Now(),
		Edge: &EdgeStatus{
			Active:    true,
			Version:   "2.8.4",
			Domain:    "api.anode.dev",
			TLSActive: true,
			RouteRules: map[string]string{
				"/api/*": "127.0.0.1:21040",
			},
		},
		Services: []ServiceStatus{
			{
				Name:            "apigateway",
				UnitName:        "anode-apigateway.service",
				State:           StateRunning,
				ActiveState:     "active",
				SubState:        "running",
				PID:             3291,
				TasksCurrent:    12,
				MemoryBytes:     25165824,
				MemoryMaxBytes:  1073741824,
				MemoryHuman:     "24.0 MB / 1.0 GB",
				CPUQuota:        "200%",
				NRestarts:       0,
				UptimeHuman:     "2d 4h",
				Port:            21040,
				PublicEndpoints: []string{"https://api.anode.dev/api/*"},
			},
			{
				Name:           "payments",
				UnitName:       "anode-payments.service",
				State:          StateCrashLoop,
				ActiveState:    "failed",
				SubState:       "failed",
				PID:            0,
				ExitCode:       2,
				NRestarts:      7,
				UptimeHuman:    "15s ago",
				MemoryMaxBytes: 1073741824,
			},
		},
	}

	var buf bytes.Buffer
	if err := PrintJSON(&buf, rep); err != nil {
		t.Fatalf("PrintJSON failed: %v", err)
	}

	var parsed ProcessReport
	if err := json.Unmarshal(buf.Bytes(), &parsed); err != nil {
		t.Fatalf("Failed to decode serialized JSON: %v", err)
	}

	if len(parsed.Services) != 2 {
		t.Fatalf("expected 2 services in JSON, got %d", len(parsed.Services))
	}
	if parsed.Services[1].State != StateCrashLoop {
		t.Errorf("expected StateCrashLoop for payments, got %s", parsed.Services[1].State)
	}
}

func TestRunInspectLocalEmptyWorkspace(t *testing.T) {
	opts := Options{
		TargetDir: t.TempDir(),
	}
	rep, err := Run(context.Background(), opts)
	if err != nil {
		t.Fatalf("Run locally failed: %v", err)
	}
	if rep == nil {
		t.Fatal("expected non-nil report")
	}
	if rep.IsRemote {
		t.Errorf("expected IsRemote=false")
	}
}
