package logs

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/deployer"
	"golang.org/x/crypto/ssh"
)

// StreamRemote logs from a remote VPS using journalctl over SSH.
func StreamRemote(ctx context.Context, opts Options) error {
	out := opts.Out
	if out == nil {
		out = os.Stdout
	}

	client, err := deployer.DialSSH(opts.Target)
	if err != nil {
		return fmt.Errorf("failed to connect to %s over SSH: %w", opts.Target, err)
	}

	// 1. Discover target systemd units
	units, err := resolveRemoteUnits(client, opts)
	if err != nil {
		return err
	}
	if len(units) == 0 {
		return fmt.Errorf("no matching services found on %s", opts.Target)
	}

	// 2. Build journalctl invocation
	cmd := buildJournalctlCommand(units, opts)

	// 3. Initiate remote stream
	stdout, stderr, session, err := client.Stream(cmd)
	if err != nil {
		return fmt.Errorf("failed to stream logs from %s: %w", opts.Target, err)
	}
	defer session.Close()

	// Ensure remote command is killed if context is cancelled
	done := make(chan struct{})
	defer close(done)
	go func() {
		select {
		case <-ctx.Done():
			_ = session.Signal(ssh.SIGINT)
			_ = session.Close()
		case <-done:
		}
	}()

	// Capture stderr for potential journalctl errors in non-follow mode
	go func() {
		errScanner := bufio.NewScanner(stderr)
		for errScanner.Scan() {
			t := errScanner.Text()
			if strings.TrimSpace(t) != "" && !strings.Contains(t, "Killed by signal") {
				fmt.Fprintf(os.Stderr, "[remote stderr] %s\n", t)
			}
		}
	}()

	// 4. Stream and format logs
	scanner := bufio.NewScanner(stdout)
	assigner := NewColorAssigner()

	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		entry, err := ParseJournaldJSON(line)
		if err != nil {
			// Fallback for non-JSON lines (e.g. standard syslog headers or notices)
			entry = &LogEntry{
				Service: "anode",
				Message: line,
				Raw:     line,
			}
		}

		if err := FormatLogLine(out, *entry, assigner, opts.Timestamps, opts.JSON); err != nil {
			return err
		}
	}

	if err := scanner.Err(); err != nil && ctx.Err() == nil {
		return fmt.Errorf("error reading remote log stream: %w", err)
	}

	return nil
}

func resolveRemoteUnits(ssh *deployer.SSHClient, opts Options) ([]string, error) {
	if opts.Service != "" {
		svc := strings.TrimSpace(opts.Service)
		if svc == "caddy" || svc == "edge" {
			return []string{"caddy.service"}, nil
		}
		// Match user-specified service name directly
		unitName := svc
		if !strings.HasPrefix(unitName, "anode-") {
			unitName = "anode-" + unitName
		}
		if !strings.HasSuffix(unitName, ".service") {
			unitName = unitName + ".service"
		}
		return []string{unitName}, nil
	}

	// Multi-service discovery: find all active and defined anode-*.service units
	var units []string
	seen := make(map[string]bool)

	out, err := ssh.Run("systemctl list-units --type=service 'anode-*' --all --no-legend --no-pager 2>/dev/null || true")
	if err == nil {
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

	// Also check /etc/systemd/system/
	if filesOut, err := ssh.Run("ls /etc/systemd/system/anode-*.service 2>/dev/null || true"); err == nil {
		for _, f := range strings.Fields(filesOut) {
			base := filepath.Base(f)
			if strings.HasPrefix(base, "anode-") && strings.HasSuffix(base, ".service") && !seen[base] {
				seen[base] = true
				units = append(units, base)
			}
		}
	}

	if opts.IncludeEdge && !seen["caddy.service"] {
		units = append(units, "caddy.service")
	}

	return units, nil
}

func buildJournalctlCommand(units []string, opts Options) string {
	var parts []string
	parts = append(parts, "journalctl")

	for _, u := range units {
		parts = append(parts, "-u", u)
	}

	lines := opts.Lines
	if lines <= 0 {
		lines = 100
	}
	parts = append(parts, "-n", fmt.Sprintf("%d", lines))

	if opts.Follow {
		parts = append(parts, "-f")
	}

	if opts.Since != "" {
		parts = append(parts, fmt.Sprintf("--since=%q", opts.Since))
	}

	if opts.Until != "" {
		parts = append(parts, fmt.Sprintf("--until=%q", opts.Until))
	}

	parts = append(parts, "--no-pager", "-o", "json")
	return strings.Join(parts, " ")
}
