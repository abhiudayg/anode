package ps

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/iag"
)

// InspectLocal examines local processes, ports, and containers running under Anode orchestrator.
func InspectLocal(ctx context.Context, opts Options) (*ProcessReport, error) {
	targetDir := opts.TargetDir
	if targetDir == "" {
		targetDir = "."
	}

	report := &ProcessReport{
		IsRemote:    false,
		Timestamp:   time.Now(),
		CgroupsMode: "local-process",
	}

	lockPath := filepath.Join(targetDir, "anode.lock.json")
	lockData, err := os.ReadFile(lockPath)
	if err != nil {
		// No lockfile found locally
		return report, nil
	}

	var lockfile iag.LockFile
	if err := json.Unmarshal(lockData, &lockfile); err != nil {
		return nil, fmt.Errorf("failed to parse local anode.lock.json: %w", err)
	}

	// 1. Inspect Local Services Defined in Lockfile
	runningProcs := findLocalProcesses()

	for name, svc := range lockfile.Services {
		status := ServiceStatus{
			Name:           name,
			UnitName:       fmt.Sprintf("local:%s", name),
			State:          StateInactive,
			MemoryMaxBytes: 1024 * 1024 * 1024,
		}

		// Find PID
		if pid, ok := runningProcs[name]; ok {
			status.PID = pid
			status.State = StateRunning
			status.ActiveState = "active"
			status.SubState = "running"
			status.UptimeHuman = "active"

			// Get Memory (with anon/file breakdown when available)
			if memBytes, bd := getLocalProcessMemory(pid); memBytes > 0 {
				status.MemoryBytes = memBytes
				status.MemoryBreakdown = bd
				status.MemoryHuman = FormatServiceMemoryHuman(&status)
			}
		} else {
			status.ActiveState = "inactive"
			status.SubState = "stopped"
			status.UptimeHuman = "stopped"
		}

		// Ingress port
		for _, ing := range svc.Ingress {
			if len(ing.Routes) > 0 {
				status.PublicEndpoints = append(status.PublicEndpoints, ing.Routes...)
			}
		}

		if !opts.All && status.State == StateInactive {
			// If not --all, only show running or defined services
			// we can still include them so developers see which services are up/down
		}
		report.Services = append(report.Services, status)
	}

	// 2. Discover Local Ephemeral Containers
	report.Resources = findLocalEphemeralContainers()

	return report, nil
}

func findLocalProcesses() map[string]int {
	procs := make(map[string]int)

	// Use ps -eo pid,command to safely list processes
	cmd := exec.Command("ps", "-eo", "pid,command")
	out, err := cmd.Output()
	if err != nil {
		return procs
	}

	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		pid, err := strconv.Atoi(fields[0])
		if err != nil {
			continue
		}

		fullCmd := strings.Join(fields[1:], " ")
		// Check for .verify/output/<svc> or binaries matching services
		if strings.Contains(fullCmd, "/.verify/output/") {
			parts := strings.Split(fullCmd, "/.verify/output/")
			if len(parts) >= 2 {
				svcName := strings.Fields(parts[1])[0]
				procs[svcName] = pid
			}
		}
	}

	return procs
}

func getLocalProcessMemory(pid int) (uint64, *MemoryBreakdown) {
	// Try /proc/<pid>/smaps_rollup first (Linux)
	if data, err := os.ReadFile(fmt.Sprintf("/proc/%d/smaps_rollup", pid)); err == nil {
		if pss, bd := ParseProcSmapsBreakdown(string(data)); pss > 0 {
			return pss, bd
		}
	}
	// Try /proc/<pid>/status (Linux)
	if data, err := os.ReadFile(fmt.Sprintf("/proc/%d/status", pid)); err == nil {
		if pss, bd := ParseProcSmapsBreakdown(string(data)); pss > 0 {
			return pss, bd
		}
	}
	// Fallback to ps -o rss= (macOS / generic UNIX)
	rss := getLocalProcessRSS(pid)
	return rss, nil
}

func getLocalProcessRSS(pid int) uint64 {
	cmd := exec.Command("ps", "-p", strconv.Itoa(pid), "-o", "rss=")
	out, err := cmd.Output()
	if err != nil {
		return 0
	}
	rssKBStr := strings.TrimSpace(string(out))
	if rssKB, err := strconv.ParseUint(rssKBStr, 10, 64); err == nil {
		return rssKB * 1024
	}
	return 0
}

func findLocalEphemeralContainers() []StatefulResourceStatus {
	var resources []StatefulResourceStatus

	dockerCmd := exec.Command("docker", "ps", "--filter", "name=anode-", "--format", "{{.Names}}|{{.Image}}|{{.Ports}}|{{.Status}}")
	out, err := dockerCmd.Output()
	if err != nil {
		return resources
	}

	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		parts := strings.Split(line, "|")
		if len(parts) >= 4 {
			res := StatefulResourceStatus{
				Name:     strings.TrimPrefix(parts[0], "anode-"),
				Kind:     parts[1],
				Endpoint: parts[2],
				Status:   parts[3],
			}
			resources = append(resources, res)
		}
	}

	return resources
}
