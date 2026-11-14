package deployer

import (
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/sshauth"
	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/knownhosts"
)

type SSHClient struct {
	client *ssh.Client
	host   string
	user   string
}

// DialSSH connects to remote server using local SSH agent or default key files (~/.ssh/id_ed25519, id_rsa)
func DialSSH(target string) (*SSHClient, error) {
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

	authMethods, err := sshauth.AuthMethods()
	if err != nil {
		return nil, err
	}

	home, _ := os.UserHomeDir()
	// Host key verification: check ~/.ssh/known_hosts, enforce strict mismatch checks and TOFU
	knownHostsPath := filepath.Join(home, ".ssh", "known_hosts")
	_ = os.MkdirAll(filepath.Dir(knownHostsPath), 0700)
	if f, err := os.OpenFile(knownHostsPath, os.O_CREATE|os.O_WRONLY, 0600); err == nil {
		if closeErr := f.Close(); closeErr != nil {
			return nil, fmt.Errorf("failed to close %s: %w", knownHostsPath, closeErr)
		}
	}

	var hostKeyCallback ssh.HostKeyCallback
	if cb, err := knownhosts.New(knownHostsPath); err == nil {
		hostKeyCallback = func(hostname string, remote net.Addr, key ssh.PublicKey) error {
			err := cb(hostname, remote, key)
			if err == nil {
				return nil
			}
			var keyErr *knownhosts.KeyError
			if errors.As(err, &keyErr) {
				if len(keyErr.Want) > 0 {
					return fmt.Errorf("SECURITY ALERT: HOST KEY MISMATCH for %s. Remote key changed or MITM attack detected! (%w)", hostname, err)
				}
				if err := checkNewHostTrust(os.Getenv("ANODE_TRUST_NEW_HOST"), hostname, ssh.FingerprintSHA256(key)); err != nil {
					return err
				}
				fmt.Printf("  ⚠ Trusting new host key for %s: %s\n", hostname, ssh.FingerprintSHA256(key))
				// Trust On First Use (TOFU): Record new host key into known_hosts
				f, fErr := os.OpenFile(knownHostsPath, os.O_APPEND|os.O_WRONLY, 0600)
				if fErr != nil {
					return fmt.Errorf("failed to open %s for appending: %w", knownHostsPath, fErr)
				}
				line := knownhosts.Line([]string{knownhosts.Normalize(hostname)}, key)
				if _, err := f.WriteString(line + "\n"); err != nil {
					_ = f.Close()
					return fmt.Errorf("failed to write host key to %s: %w", knownHostsPath, err)
				}
				if err := f.Close(); err != nil {
					return fmt.Errorf("failed to flush host key to %s: %w", knownHostsPath, err)
				}
				return nil
			}
			return err
		}
	} else {
		return nil, fmt.Errorf("failed to initialize known_hosts verifier: %w", err)
	}

	cfg := &ssh.ClientConfig{
		User:            user,
		Auth:            authMethods,
		HostKeyCallback: hostKeyCallback,
		Timeout:         10 * time.Second,
	}

	client, err := ssh.Dial("tcp", host, cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to dial SSH %s: %w", host, err)
	}

	return &SSHClient{
		client: client,
		host:   host,
		user:   user,
	}, nil
}

// Run executes a command on the remote host and returns combined output
func (s *SSHClient) Run(cmd string) (string, error) {
	if !s.isRoot() {
		cmd = sudoWrap(cmd)
	}
	session, err := s.client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create SSH session: %w", err)
	}
	defer session.Close()

	out, err := session.CombinedOutput(cmd)
	if err != nil {
		return string(out), fmt.Errorf("remote command failed: %s (%w)", string(out), err)
	}
	return string(out), nil
}

// Client returns the underlying *ssh.Client
func (s *SSHClient) Client() *ssh.Client {
	return s.client
}

// Stream initiates a command on the remote host with streaming stdout/stderr reader pipes
func (s *SSHClient) Stream(cmd string) (io.Reader, io.Reader, *ssh.Session, error) {
	if !s.isRoot() {
		cmd = sudoWrap(cmd)
	}
	session, err := s.client.NewSession()
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to create SSH session: %w", err)
	}
	stdout, err := session.StdoutPipe()
	if err != nil {
		_ = session.Close()
		return nil, nil, nil, fmt.Errorf("failed to get stdout pipe: %w", err)
	}
	stderr, err := session.StderrPipe()
	if err != nil {
		_ = session.Close()
		return nil, nil, nil, fmt.Errorf("failed to get stderr pipe: %w", err)
	}
	if err := session.Start(cmd); err != nil {
		_ = session.Close()
		return nil, nil, nil, fmt.Errorf("failed to start remote command: %w", err)
	}
	return stdout, stderr, session, nil
}

// StreamFile copies a local file to remote host with specified permissions
// StreamBytes copies in-memory bytes directly to remote host via SCP protocol safely without shell interpolation
func (s *SSHClient) Close() error {
	return s.client.Close()
}
