package doctor

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
	"golang.org/x/crypto/ssh/knownhosts"
)

const CategoryRemote = "REMOTE VPS PRE-FLIGHT"

// CheckLocalSSHKeys checks if the local machine has available SSH identity keys or an agent.
func CheckLocalSSHKeys() CheckResult {
	home, _ := os.UserHomeDir()
	keyFiles := []string{
		filepath.Join(home, ".ssh", "id_ed25519"),
		filepath.Join(home, ".ssh", "id_rsa"),
	}

	var foundKeys []string
	for _, k := range keyFiles {
		if _, err := os.Stat(k); err == nil {
			foundKeys = append(foundKeys, filepath.Base(k))
		}
	}

	hasAgent := false
	if sock := os.Getenv("SSH_AUTH_SOCK"); sock != "" {
		if _, err := os.Stat(sock); err == nil {
			hasAgent = true
		}
	}

	if len(foundKeys) == 0 && !hasAgent {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Toolchain & Keys",
			Status:      StatusWarn,
			Message:     "No default SSH keys (~/.ssh/id_ed25519, id_rsa) or active SSH_AUTH_SOCK found",
			Remediation: "Generate an SSH key: 'ssh-keygen -t ed25519' or start ssh-agent: 'ssh-add'.",
		}
	}

	msg := fmt.Sprintf("Found local keys: %v", foundKeys)
	if hasAgent {
		msg += " (SSH agent socket active)"
	}

	return CheckResult{
		Category: CategoryRemote,
		Name:     "SSH Toolchain & Keys",
		Status:   StatusOK,
		Message:  msg,
	}
}

// CheckRemoteTarget performs non-mutating pre-flight verification of a remote target VPS.
func CheckRemoteTarget(ctx context.Context, target string) []CheckResult {
	var results []CheckResult

	// 1. Dial SSH with a strict 3-second timeout
	client, dialDuration, err := dialSSHWith3sTimeout(target)
	if err != nil {
		results = append(results, classifySSHError(target, err))
		return results
	}
	defer client.Close()

	results = append(results, CheckResult{
		Category: CategoryRemote,
		Name:     "SSH Connectivity",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Connected to %s in %dms via public key", target, dialDuration.Milliseconds()),
	})

	// 2. Kernel & Architecture
	osOut, err := runRemoteCmd(client, "uname -s && uname -m && uname -r")
	if err != nil {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Remote OS & Kernel",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Failed to query remote kernel: %v", err),
			Remediation: "Verify the remote user has basic shell execution privileges.",
		})
	} else {
		lines := strings.Split(strings.TrimSpace(osOut), "\n")
		osName := ""
		arch := ""
		release := ""
		if len(lines) >= 1 {
			osName = lines[0]
		}
		if len(lines) >= 2 {
			arch = lines[1]
		}
		if len(lines) >= 3 {
			release = lines[2]
		}

		if strings.ToLower(osName) != "linux" {
			results = append(results, CheckResult{
				Category:    CategoryRemote,
				Name:        "Remote OS & Kernel",
				Status:      StatusFail,
				Message:     fmt.Sprintf("Unsupported target OS '%s'; Anode requires bare-metal Linux", osName),
				Remediation: "Deploy Anode to an Ubuntu, Debian, Fedora, Arch, or generic Linux host.",
			})
		} else {
			results = append(results, CheckResult{
				Category: CategoryRemote,
				Name:     "Remote OS & Kernel",
				Status:   StatusOK,
				Message:  fmt.Sprintf("Verified Linux %s (%s)", release, arch),
			})
		}
	}

	// 3. Init System (systemd)
	systemdOut, err := runRemoteCmd(client, "systemctl is-system-running || true")
	if err != nil || strings.Contains(systemdOut, "not found") || strings.Contains(systemdOut, "Failed to connect to bus") {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Init System (systemd)",
			Status:      StatusFail,
			Message:     "systemd is not running as PID 1 on the target host",
			Remediation: "Anode requires systemd for least-privilege DynamicUser execution and sandboxing.",
		})
	} else {
		status := strings.TrimSpace(systemdOut)
		results = append(results, CheckResult{
			Category: CategoryRemote,
			Name:     "Init System (systemd)",
			Status:   StatusOK,
			Message:  fmt.Sprintf("systemd is active (system state: %s)", status),
		})
	}

	// 4. Cgroups v2 unified hierarchy
	cgroupOut, err := runRemoteCmd(client, "test -f /sys/fs/cgroup/memory.current && echo 'v2' || test -f /sys/fs/cgroup/memory/memory.stat && echo 'v1' || echo 'none'")
	cgroupVer := strings.TrimSpace(cgroupOut)
	if strings.Contains(cgroupVer, "v2") {
		results = append(results, CheckResult{
			Category: CategoryRemote,
			Name:     "Cgroups v2 Hierarchy",
			Status:   StatusOK,
			Message:  "Cgroups v2 unified hierarchy active (/sys/fs/cgroup/memory.current readable)",
		})
	} else if strings.Contains(cgroupVer, "v1") {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Cgroups v2 Hierarchy",
			Status:      StatusWarn,
			Message:     "Target VPS is using legacy cgroups v1; resource memory ceiling telemetry will fall back to /proc/smaps_rollup",
			Remediation: "Enable unified cgroups v2 by booting with kernel param 'systemd.unified_cgroup_hierarchy=1'.",
		})
	} else {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Cgroups v2 Hierarchy",
			Status:      StatusWarn,
			Message:     "Cgroup memory controllers not mounted or restricted",
			Remediation: "Ensure cgroups controller permissions are enabled on the host.",
		})
	}

	// 5. Caddy Reverse Proxy & Edge Routing
	caddyOut, err := runRemoteCmd(client, "caddy version 2>/dev/null || which caddy || echo 'missing'")
	if strings.Contains(caddyOut, "missing") || strings.TrimSpace(caddyOut) == "" {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Edge Proxy (Caddy)",
			Status:      StatusWarn,
			Message:     "Caddy binary not currently installed; 'anode deploy' will attempt automatic installation via apt",
			Remediation: "Pre-install Caddy manually: 'sudo apt install -y caddy' or allow Anode to bootstrap it.",
		})
	} else {
		caddyVer := strings.TrimSpace(strings.Split(caddyOut, "\n")[0])
		results = append(results, CheckResult{
			Category: CategoryRemote,
			Name:     "Edge Proxy (Caddy)",
			Status:   StatusOK,
			Message:  fmt.Sprintf("Caddy available on host: %s", caddyVer),
		})
	}

	// 6. User Sandboxing & Permissions
	userOut, _ := runRemoteCmd(client, "id -u")
	uid := strings.TrimSpace(userOut)
	if uid == "0" {
		results = append(results, CheckResult{
			Category: CategoryRemote,
			Name:     "Privilege & User Sandboxing",
			Status:   StatusOK,
			Message:  "Connected as root (can provision least-privilege 'anode' DynamicUser system units)",
		})
	} else {
		results = append(results, CheckResult{
			Category:    CategoryRemote,
			Name:        "Privilege & User Sandboxing",
			Status:      StatusWarn,
			Message:     fmt.Sprintf("Connected as non-root UID %s; deploying system units may require sudo permissions", uid),
			Remediation: "Ensure current user has passwordless sudo for systemctl and /var/lib/anode, or connect as root.",
		})
	}

	return results
}

func dialSSHWith3sTimeout(target string) (*ssh.Client, time.Duration, error) {
	parts := strings.Split(target, "@")
	user := "root"
	host := target
	if len(parts) == 2 {
		user = parts[0]
		host = parts[1]
	}

	if !strings.Contains(host, ":") {
		host = host + ":22"
	}

	var authMethods []ssh.AuthMethod

	// 1. Try SSH Agent socket
	if sock := os.Getenv("SSH_AUTH_SOCK"); sock != "" {
		if agentConn, err := net.Dial("unix", sock); err == nil {
			authMethods = append(authMethods, ssh.PublicKeysCallback(agent.NewClient(agentConn).Signers))
		}
	}

	// 2. Try default key files
	home, _ := os.UserHomeDir()
	keyFiles := []string{
		filepath.Join(home, ".ssh", "id_ed25519"),
		filepath.Join(home, ".ssh", "id_rsa"),
	}

	for _, keyPath := range keyFiles {
		if keyData, err := os.ReadFile(keyPath); err == nil {
			if signer, err := ssh.ParsePrivateKey(keyData); err == nil {
				authMethods = append(authMethods, ssh.PublicKeys(signer))
			}
		}
	}

	if len(authMethods) == 0 {
		return nil, 0, fmt.Errorf("no_ssh_keys_found")
	}

	knownHostsPath := filepath.Join(home, ".ssh", "known_hosts")
	var hostKeyCallback ssh.HostKeyCallback
	if cb, err := knownhosts.New(knownHostsPath); err == nil {
		hostKeyCallback = cb
	} else {
		hostKeyCallback = func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			return nil
		}
	}

	cfg := &ssh.ClientConfig{
		User:            user,
		Auth:            authMethods,
		HostKeyCallback: hostKeyCallback,
		Timeout:         3 * time.Second,
	}

	start := time.Now()
	client, err := ssh.Dial("tcp", host, cfg)
	dur := time.Since(start)
	if err != nil {
		return nil, dur, err
	}

	return client, dur, nil
}

func classifySSHError(target string, err error) CheckResult {
	errStr := err.Error()

	// 1. Missing keys
	if errStr == "no_ssh_keys_found" {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity",
			Status:      StatusFail,
			Message:     "No SSH authentication methods available on local machine",
			Remediation: "Add a key to ssh-agent ('ssh-add ~/.ssh/id_ed25519') or generate one ('ssh-keygen').",
		}
	}

	// 2. DNS Failure
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) || strings.Contains(errStr, "no such host") || strings.Contains(errStr, "lookup") {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity (DNS Failure)",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Unable to resolve hostname for target '%s': %v", target, err),
			Remediation: "Verify the remote domain or IP address in your DNS configuration or /etc/hosts.",
		}
	}

	// 3. Port 22 unreachable / timeout / firewall drop
	if strings.Contains(errStr, "i/o timeout") || strings.Contains(errStr, "connection timed out") {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity (Port 22 Timeout)",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Connection to %s timed out after 3 seconds (port 22 unreachable)", target),
			Remediation: "Check network connectivity, host firewall (ufw/iptables), or cloud security groups (allow TCP 22).",
		}
	}

	if strings.Contains(errStr, "connection refused") {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity (Connection Refused)",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Connection refused by %s on port 22", target),
			Remediation: "Verify that sshd daemon is running on the target host: 'systemctl status ssh'.",
		}
	}

	// 4. Authentication Rejected
	if strings.Contains(errStr, "ssh: handshake failed") || strings.Contains(errStr, "unable to authenticate") || strings.Contains(errStr, "no supported methods remain") {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity (Auth Rejected)",
			Status:      StatusFail,
			Message:     fmt.Sprintf("SSH public key was rejected by %s", target),
			Remediation: "Copy your public key to the target server: 'ssh-copy-id " + target + "'.",
		}
	}

	// 5. Host key verification failure
	if strings.Contains(errStr, "knownhosts: key is unknown") || strings.Contains(errStr, "host key mismatch") {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "SSH Connectivity (Host Key Mismatch)",
			Status:      StatusFail,
			Message:     fmt.Sprintf("SSH host key verification failed for %s: %v", target, err),
			Remediation: "Update ~/.ssh/known_hosts or run 'ssh-keyscan -H " + target + " >> ~/.ssh/known_hosts'.",
		}
	}

	// Generic error fallback
	return CheckResult{
		Category:    CategoryRemote,
		Name:        "SSH Connectivity",
		Status:      StatusFail,
		Message:     fmt.Sprintf("Failed to connect to %s: %v", target, err),
		Remediation: "Test manual SSH connectivity: 'ssh -vvv " + target + "'.",
	}
}

func runRemoteCmd(client *ssh.Client, cmd string) (string, error) {
	session, err := client.NewSession()
	if err != nil {
		return "", err
	}
	defer session.Close()

	out, err := session.CombinedOutput(cmd)
	if err != nil {
		return string(out), err
	}
	return string(out), nil
}
