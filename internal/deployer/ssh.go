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

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
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
		return nil, fmt.Errorf("no SSH authentication methods found (check ssh-agent or ~/.ssh keys)")
	}

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

// StreamFile copies a local file to remote host with specified permissions
func (s *SSHClient) StreamFile(srcPath string, dstPath string, mode os.FileMode) error {
	session, err := s.client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create SSH session for upload: %w", err)
	}
	defer session.Close()

	srcFile, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("failed to open local file: %w", err)
	}
	defer srcFile.Close()

	stat, err := srcFile.Stat()
	if err != nil {
		return err
	}

	stdin, err := session.StdinPipe()
	if err != nil {
		return err
	}

	// Use SCP protocol over SSH session
	targetDir := filepath.Dir(dstPath)
	targetBase := filepath.Base(dstPath)

	go func() {
		defer stdin.Close()
		fmt.Fprintf(stdin, "C%04o %d %s\n", mode.Perm(), stat.Size(), targetBase)
		io.Copy(stdin, srcFile)
		fmt.Fprint(stdin, "\x00")
	}()

	cmd := fmt.Sprintf("scp -t %s", targetDir)
	if err := session.Run(cmd); err != nil {
		return fmt.Errorf("SCP stream failed for %s: %w", dstPath, err)
	}

	return nil
}

// StreamBytes copies in-memory bytes directly to remote host via SCP protocol safely without shell interpolation
func (s *SSHClient) StreamBytes(data []byte, dstPath string, mode os.FileMode) error {
	session, err := s.client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create SSH session for upload: %w", err)
	}
	defer session.Close()

	stdin, err := session.StdinPipe()
	if err != nil {
		return err
	}

	targetDir := filepath.Dir(dstPath)
	targetBase := filepath.Base(dstPath)

	go func() {
		defer stdin.Close()
		fmt.Fprintf(stdin, "C%04o %d %s\n", mode.Perm(), len(data), targetBase)
		_, _ = stdin.Write(data)
		fmt.Fprint(stdin, "\x00")
	}()

	cmd := fmt.Sprintf("scp -t %s", targetDir)
	if err := session.Run(cmd); err != nil {
		return fmt.Errorf("SCP stream bytes failed for %s: %w", dstPath, err)
	}

	return nil
}

func (s *SSHClient) Close() error {
	return s.client.Close()
}
