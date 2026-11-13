package ps

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

const (
	colorReset  = "\033[0m"
	colorBold   = "\033[1m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorCyan   = "\033[36m"
	colorGray   = "\033[90m"
)

// FormatBytes formats byte counts into human-readable binary unit strings (B, KB, MB, GB).
func FormatBytes(b uint64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := uint64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// FormatDuration formats durations into concise uptime representations.
func FormatDuration(d time.Duration) string {
	if d < 0 {
		return "0s"
	}
	days := int(d.Hours()) / 24
	hours := int(d.Hours()) % 24
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh", days, hours)
	}
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}

// ColorizeState wraps service states in appropriate ANSI color codes.
func ColorizeState(state ServiceState, text string) string {
	switch state {
	case StateRunning:
		return colorGreen + text + colorReset
	case StateRestarting:
		return colorYellow + text + colorReset
	case StateCrashLoop, StateFailed:
		return colorRed + colorBold + text + colorReset
	case StateInactive:
		return colorGray + text + colorReset
	default:
		return text
	}
}

// PrintReport writes the formatted process status to the standard output.
func PrintReport(w io.Writer, report *ProcessReport) {
	if report.IsRemote {
		fmt.Fprintf(w, "%s⚡ Anode Process Status — Target: %s%s\n", colorBold, report.Target, colorReset)
		if report.ReleaseID != "" {
			fmt.Fprintf(w, "%sRelease:%s %s   %sCgroups:%s %s\n", colorGray, colorReset, report.ReleaseID, colorGray, colorReset, report.CgroupsMode)
		}
	} else {
		fmt.Fprintf(w, "%s⚡ Anode Process Status — Local Orchestrator%s\n", colorBold, colorReset)
		fmt.Fprintf(w, "%sRuntime:%s Local Supervisor & Ephemeral Loopbacks\n", colorGray, colorReset)
	}
	fmt.Fprintln(w, strings.Repeat("─", 80))

	// Edge Section
	if report.Edge != nil {
		fmt.Fprintf(w, "\n%s[EDGE REVERSE PROXY — CADDY]%s\n", colorBold+colorCyan, colorReset)
		if report.Edge.Active {
			tlsMsg := "automated TLS active"
			if !report.Edge.TLSActive {
				tlsMsg = "TLS disabled / HTTP"
			}
			fmt.Fprintf(w, "  ✓ %s (v%s) — %s (%s)\n",
				ColorizeState(StateRunning, "Active"),
				report.Edge.Version,
				report.Edge.Domain,
				tlsMsg,
			)
			if len(report.Edge.RouteRules) > 0 {
				for route, upstream := range report.Edge.RouteRules {
					fmt.Fprintf(w, "    ↳ %-24s ──> %s\n", route, upstream)
				}
			}
		} else {
			fmt.Fprintf(w, "  ❌ %s — Caddy service is inactive or not responding\n",
				ColorizeState(StateFailed, "Down"))
		}
	}

	// Services Section
	fmt.Fprintf(w, "\n%s[MICROSERVICES & TOPOLOGY]%s\n", colorBold+colorCyan, colorReset)
	if len(report.Services) == 0 {
		fmt.Fprintln(w, "  (No active Anode services found on target. Run 'anode deploy' or 'anode dev')")
	} else {
		// Table Header
		fmt.Fprintf(w, "%s%-18s %-16s %-8s %-8s %-18s %-6s %-10s %-16s%s\n",
			colorBold,
			"SERVICE", "STATUS", "PID", "TASKS", "MEMORY (CUR/MAX)", "REST", "UPTIME", "PORT/EDGE",
			colorReset,
		)
		fmt.Fprintln(w, strings.Repeat("─", 80))

		for _, svc := range report.Services {
			pidStr := "-"
			if svc.PID > 0 {
				pidStr = fmt.Sprintf("%d", svc.PID)
			}
			tasksStr := "-"
			if svc.TasksCurrent > 0 {
				tasksStr = fmt.Sprintf("%d", svc.TasksCurrent)
			}

			memStr := "-"
			if svc.MemoryHuman != "" {
				memStr = svc.MemoryHuman
			} else if svc.MemoryBytes > 0 {
				memStr = FormatBytes(svc.MemoryBytes)
			}

			portStr := "-"
			if svc.Port > 0 {
				portStr = fmt.Sprintf(":%d", svc.Port)
			}
			if len(svc.PublicEndpoints) > 0 {
				portStr = fmt.Sprintf(":%d (%s)", svc.Port, svc.PublicEndpoints[0])
			}

			statusDisplay := string(svc.State)
			if svc.State == StateCrashLoop {
				statusDisplay = fmt.Sprintf("crashloop (%d)", svc.ExitCode)
			} else if svc.State == StateRestarting {
				statusDisplay = "restarting"
			}

			coloredStatus := ColorizeState(svc.State, fmt.Sprintf("%-16s", statusDisplay))

			fmt.Fprintf(w, "%-18s %s %-8s %-8s %-18s %-6d %-10s %-16s\n",
				svc.Name,
				coloredStatus,
				pidStr,
				tasksStr,
				memStr,
				svc.NRestarts,
				svc.UptimeHuman,
				portStr,
			)
		}
	}

	// Stateful Resources Section
	if len(report.Resources) > 0 {
		fmt.Fprintf(w, "\n%s[STATEFUL BACKING STORES]%s\n", colorBold+colorCyan, colorReset)
		for _, res := range report.Resources {
			fmt.Fprintf(w, "  • %-16s [%-10s] ──> %-22s (%s)\n",
				res.Name,
				res.Kind,
				res.Endpoint,
				ColorizeState(StateRunning, res.Status),
			)
		}
	}

	fmt.Fprintln(w, "")
}

// PrintJSON serializes the complete ProcessReport as formatted JSON.
func PrintJSON(w io.Writer, report *ProcessReport) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(report)
}

// Output writes the report based on options (JSON or formatted ANSI table).
func Output(report *ProcessReport, jsonOutput bool) error {
	if jsonOutput {
		return PrintJSON(os.Stdout, report)
	}
	PrintReport(os.Stdout, report)
	return nil
}
