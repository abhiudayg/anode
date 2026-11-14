package ps

import (
	"bufio"
	"context"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/deployer"
)

// InspectRemote connects to a remote VPS over SSH and extracts real-time process,
// cgroup v2 metrics, systemd unit health, and Caddy edge configurations.
func InspectRemote(ctx context.Context, target string, opts Options) (*ProcessReport, error) {
	sshClient, err := deployer.DialSSH(target)
	if err != nil {
		return nil, fmt.Errorf("failed to establish SSH connection to %s: %w", target, err)
	}
	defer sshClient.Close()

	report := &ProcessReport{
		Target:      target,
		IsRemote:    true,
		Timestamp:   time.Now(),
		CgroupsMode: detectCgroupsMode(sshClient),
	}

	// 1. Query Current Active Release ID
	if out, err := sshClient.Run("readlink /var/lib/anode/releases/latest 2>/dev/null || true"); err == nil {
		latest := strings.TrimSpace(out)
		if latest != "" {
			report.ReleaseID = filepath.Base(latest)
		}
	}

	// 2. Query Caddy Edge Status
	report.Edge = inspectCaddyEdge(sshClient)

	// 3. Discover Anode Units (system & user units)
	units := discoverAnodeUnits(sshClient)

	// 4. Query & Parse Unit Properties
	for _, unit := range units {
		status := inspectSystemdUnit(sshClient, unit, report.Edge)
		if status == nil {
			continue
		}
		if !opts.All && (status.State == StateInactive && status.NRestarts == 0) {
			continue
		}
		report.Services = append(report.Services, *status)
	}

	return report, nil
}

func detectCgroupsMode(ssh *deployer.SSHClient) string {
	out, err := ssh.Run("test -f /sys/fs/cgroup/cgroup.controllers && echo 'v2' || (test -d /sys/fs/cgroup/memory && echo 'v1' || echo 'none')")
	if err != nil {
		return "unknown"
	}
	mode := strings.TrimSpace(out)
	switch mode {
	case "v2":
		return "v2 (unified)"
	case "v1":
		return "v1 (hybrid/fallback)"
	default:
		return "unsupported"
	}
}

func inspectCaddyEdge(ssh *deployer.SSHClient) *EdgeStatus {
	edge := &EdgeStatus{
		RouteRules: make(map[string]string),
	}

	// Check if active
	out, err := ssh.Run("systemctl is-active caddy 2>/dev/null || true")
	if err == nil && strings.TrimSpace(out) == "active" {
		edge.Active = true
	}

	// Get Caddy version
	if verOut, err := ssh.Run("caddy version 2>/dev/null || true"); err == nil {
		parts := strings.Fields(verOut)
		if len(parts) >= 1 {
			edge.Version = strings.TrimPrefix(parts[0], "v")
		}
	}

	// Parse Caddyfile for domain and reverse-proxy routes
	caddyContent, err := ssh.Run("cat /etc/caddy/Caddyfile 2>/dev/null || true")
	if err == nil && strings.TrimSpace(caddyContent) != "" {
		parseCaddyfile(caddyContent, edge)
	}

	return edge
}

func parseCaddyfile(content string, edge *EdgeStatus) {
	scanner := bufio.NewScanner(strings.NewReader(content))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// First non-comment top-level token is often the domain block e.g. "api.domain.com {" or ":80 {"
		if edge.Domain == "" && strings.HasSuffix(line, "{") {
			domainCandidate := strings.TrimSpace(strings.TrimSuffix(line, "{"))
			edge.Domain = domainCandidate
			if !strings.HasPrefix(domainCandidate, ":") && !strings.HasPrefix(domainCandidate, "http://") {
				edge.TLSActive = true
			}
		}

		// Look for reverse_proxy directives:
		// reverse_proxy /api/* 127.0.0.1:21040
		// or handle path blocks
		if strings.HasPrefix(line, "reverse_proxy") {
			fields := strings.Fields(line)
			if len(fields) == 3 {
				// reverse_proxy <path> <upstream>
				edge.RouteRules[fields[1]] = fields[2]
			} else if len(fields) == 2 {
				// reverse_proxy <upstream> (root fallback)
				edge.RouteRules["/"] = fields[1]
			}
		} else if strings.HasPrefix(line, "handle_path") || strings.HasPrefix(line, "handle") {
			fields := strings.Fields(line)
			if len(fields) >= 2 {
				path := fields[1]
				if scanner.Scan() {
					inner := strings.TrimSpace(scanner.Text())
					if strings.HasPrefix(inner, "reverse_proxy") {
						subFields := strings.Fields(inner)
						if len(subFields) >= 2 {
							edge.RouteRules[path] = subFields[len(subFields)-1]
						}
					}
				}
			}
		}
	}
}

func discoverAnodeUnits(ssh *deployer.SSHClient) []string {
	var units []string
	seen := make(map[string]bool)

	// 1. Check system units via systemctl
	if out, err := ssh.Run("systemctl list-units --type=service 'anode-*' --all --no-legend --no-pager 2>/dev/null || true"); err == nil {
		scanner := bufio.NewScanner(strings.NewReader(out))
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) > 0 {
				u := fields[0]
				if strings.HasPrefix(u, "anode-") && strings.HasSuffix(u, ".service") && !seen[u] {
					seen[u] = true
					units = append(units, u)
				}
			}
		}
	}

	// 2. Discover unit files directly from disk (/etc/systemd/system)
	if out, err := ssh.Run("ls /etc/systemd/system/anode-*.service 2>/dev/null || true"); err == nil {
		for _, f := range strings.Fields(out) {
			base := filepath.Base(f)
			if strings.HasPrefix(base, "anode-") && strings.HasSuffix(base, ".service") && !seen[base] {
				seen[base] = true
				units = append(units, base)
			}
		}
	}

	// 3. Check --user units in case deployed under rootless user
	if out, err := ssh.Run("systemctl --user list-units --type=service 'anode-*' --all --no-legend --no-pager 2>/dev/null || true"); err == nil {
		scanner := bufio.NewScanner(strings.NewReader(out))
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) > 0 {
				u := fields[0]
				if strings.HasPrefix(u, "anode-") && strings.HasSuffix(u, ".service") && !seen[u] {
					seen[u] = true
					units = append(units, u)
				}
			}
		}
	}

	return units
}

func inspectSystemdUnit(ssh *deployer.SSHClient, unit string, edge *EdgeStatus) *ServiceStatus {
	// Query unit properties and cgroup memory.stat in a single round-trip
	propsCmd := fmt.Sprintf(
		"systemctl show %s -p Id,Description,LoadState,ActiveState,SubState,MainPID,TasksCurrent,CPUUsageNSec,MemoryCurrent,ControlGroup,NRestarts,ExecMainStatus,ExecMainCode,ActiveEnterTimestamp,ExecMainStartTimestamp,ExecMainExitTimestamp,Environment --no-pager 2>/dev/null || true; "+
			"echo '---CGROUP_STAT---'; "+
			"CG=$(systemctl show %s -p ControlGroup 2>/dev/null | grep -E '^ControlGroup=' | cut -d= -f2-); "+
			"[ -n \"$CG\" ] && [ -f \"/sys/fs/cgroup$CG/memory.stat\" ] && cat \"/sys/fs/cgroup$CG/memory.stat\" || "+
			"([ -f \"/sys/fs/cgroup/system.slice/%s/memory.stat\" ] && cat \"/sys/fs/cgroup/system.slice/%s/memory.stat\" || true)",
		unit, unit, unit, unit,
	)
	out, err := ssh.Run(propsCmd)
	if err != nil || strings.TrimSpace(out) == "" {
		return nil
	}

	parts := strings.SplitN(out, "---CGROUP_STAT---", 2)
	props := parseSystemdProperties(parts[0])
	statPart := ""
	if len(parts) > 1 {
		statPart = strings.TrimSpace(parts[1])
	}

	svcName := strings.TrimPrefix(strings.TrimSuffix(unit, ".service"), "anode-")

	status := &ServiceStatus{
		Name:           svcName,
		UnitName:       unit,
		ActiveState:    props["ActiveState"],
		SubState:       props["SubState"],
		MemoryMaxBytes: 1024 * 1024 * 1024, // 1GB default MemoryMax in Anode systemd template
	}

	// PID
	if pidStr := props["MainPID"]; pidStr != "" {
		if pid, err := strconv.Atoi(pidStr); err == nil {
			status.PID = pid
		}
	}

	// Tasks / Threads (Edge Case 2: Multi-process services & thread pools)
	if tasksStr := props["TasksCurrent"]; tasksStr != "" && tasksStr != "[not set]" {
		if tasks, err := strconv.Atoi(tasksStr); err == nil {
			status.TasksCurrent = tasks
		}
	}

	// Restarts
	if restStr := props["NRestarts"]; restStr != "" {
		if rest, err := strconv.Atoi(restStr); err == nil {
			status.NRestarts = rest
		}
	}

	// Exit Code
	if exitStr := props["ExecMainStatus"]; exitStr != "" {
		if code, err := strconv.Atoi(exitStr); err == nil {
			status.ExitCode = code
		}
	}

	// Port discovery from Environment
	if envStr := props["Environment"]; envStr != "" {
		for _, e := range strings.Fields(envStr) {
			if strings.HasPrefix(e, "PORT=") {
				pStr := strings.TrimPrefix(e, "PORT=")
				if p, err := strconv.Atoi(pStr); err == nil {
					status.Port = p
				}
			}
		}
	}

	// Cgroups v2 Memory vs Fallback (with anonymous, file cache, and kernel breakdown)
	memSet := false
	if memStr := props["MemoryCurrent"]; memStr != "" && memStr != "[not set]" && memStr != "18446744073709551615" {
		if mem, err := strconv.ParseUint(memStr, 10, 64); err == nil && mem > 0 {
			status.MemoryBytes = mem
			memSet = true
		}
	}

	if statPart != "" {
		status.MemoryBreakdown = ParseMemoryStat(statPart)
		if status.MemoryBytes == 0 && status.MemoryBreakdown != nil {
			status.MemoryBytes = status.MemoryBreakdown.AnonBytes + status.MemoryBreakdown.FileBytes + status.MemoryBreakdown.KernelBytes
			if status.MemoryBytes > 0 {
				memSet = true
			}
		}
	}

	if (!memSet || status.MemoryBreakdown == nil) && status.PID > 0 {
		fallbackMem, fallbackBreakdown := queryProcMemoryAndBreakdown(ssh, status.PID)
		if !memSet && fallbackMem > 0 {
			status.MemoryBytes = fallbackMem
			status.CgroupFallback = true
			memSet = true
		}
		if status.MemoryBreakdown == nil && fallbackBreakdown != nil {
			status.MemoryBreakdown = fallbackBreakdown
		}
	}

	status.MemoryHuman = FormatServiceMemoryHuman(status)

	// CPU Quota & Usage
	status.CPUQuota = "200%" // Anode default CPUQuota in template
	if cpuStr := props["CPUUsageNSec"]; cpuStr != "" && cpuStr != "[not set]" {
		if nsec, err := strconv.ParseUint(cpuStr, 10, 64); err == nil {
			status.CPUUsageNSec = nsec
		}
	}

	// State Classification & Crashloop Detection (Edge Case 3: Flapping/Crashing services)
	status.State = classifyState(status.ActiveState, status.SubState, status.NRestarts, status.ExitCode)

	// Uptime calculation
	status.Uptime, status.UptimeHuman = calculateUptime(props["ActiveEnterTimestamp"], props["ExecMainExitTimestamp"], status.State)

	// Match Public Endpoints from Edge Caddy
	if edge != nil && status.Port > 0 {
		portTarget := fmt.Sprintf("127.0.0.1:%d", status.Port)
		colonTarget := fmt.Sprintf(":%d", status.Port)
		for route, up := range edge.RouteRules {
			if strings.Contains(up, portTarget) || strings.Contains(up, colonTarget) {
				pubURL := route
				if edge.Domain != "" {
					scheme := "http"
					if edge.TLSActive {
						scheme = "https"
					}
					pubURL = fmt.Sprintf("%s://%s%s", scheme, edge.Domain, route)
				}
				status.PublicEndpoints = append(status.PublicEndpoints, pubURL)
			}
		}
	}

	return status
}

func parseSystemdProperties(out string) map[string]string {
	props := make(map[string]string)
	scanner := bufio.NewScanner(strings.NewReader(out))
	for scanner.Scan() {
		line := scanner.Text()
		idx := strings.Index(line, "=")
		if idx != -1 {
			k := strings.TrimSpace(line[:idx])
			v := strings.TrimSpace(line[idx+1:])
			props[k] = v
		}
	}
	return props
}

func classifyState(activeState, subState string, restarts, exitCode int) ServiceState {
	if activeState == "active" {
		if subState == "auto-restart" {
			return StateRestarting
		}
		if subState == "running" {
			return StateRunning
		}
		return StateRunning
	}

	if activeState == "failed" {
		if restarts > 0 {
			return StateCrashLoop
		}
		return StateFailed
	}

	if subState == "auto-restart" {
		if restarts > 3 {
			return StateCrashLoop
		}
		return StateRestarting
	}

	if activeState == "inactive" || activeState == "deactivating" {
		if restarts > 0 && exitCode != 0 {
			return StateCrashLoop
		}
		return StateInactive
	}

	return StateUnknown
}

func calculateUptime(enterTimestamp, exitTimestamp string, state ServiceState) (time.Duration, string) {
	if state == StateInactive || enterTimestamp == "" || enterTimestamp == "[not set]" {
		return 0, "stopped"
	}

	targetTimeStr := enterTimestamp
	if state == StateCrashLoop || state == StateRestarting {
		if exitTimestamp != "" && exitTimestamp != "[not set]" {
			targetTimeStr = exitTimestamp
		}
	}

	// systemd timestamp formats e.g. "Fri 2026-11-13 14:15:20 UTC" or "2026-11-13 14:15:20"
	layouts := []string{
		"Mon 2006-01-02 15:04:05 MST",
		"2006-01-02 15:04:05 MST",
		"Mon 2006-01-02 15:04:05",
		"2006-01-02 15:04:05",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, targetTimeStr); err == nil {
			dur := time.Since(t)
			if state == StateCrashLoop || state == StateRestarting {
				return dur, fmt.Sprintf("%s ago", FormatDuration(dur))
			}
			return dur, FormatDuration(dur)
		}
	}

	if state == StateRunning {
		return 0, "active"
	}
	return 0, string(state)
}

func queryProcMemoryAndBreakdown(ssh *deployer.SSHClient, pid int) (uint64, *MemoryBreakdown) {
	// Try /proc/<pid>/smaps_rollup or status (accurate for PSS and anon/file breakdown)
	cmd := fmt.Sprintf("cat /proc/%d/smaps_rollup 2>/dev/null || cat /proc/%d/status 2>/dev/null || true", pid, pid)
	if out, err := ssh.Run(cmd); err == nil && strings.TrimSpace(out) != "" {
		pss, breakdown := ParseProcSmapsBreakdown(out)
		if pss > 0 || breakdown != nil {
			return pss, breakdown
		}
	}

	// Fallback to /proc/<pid>/statm
	statmCmd := fmt.Sprintf("cat /proc/%d/statm 2>/dev/null || true", pid)
	if out, err := ssh.Run(statmCmd); err == nil {
		fields := strings.Fields(out)
		if len(fields) >= 2 {
			if pages, err := strconv.ParseUint(fields[1], 10, 64); err == nil {
				return pages * 4096, nil // standard 4KB page size
			}
		}
	}

	return 0, nil
}
