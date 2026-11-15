package deployer

import (
	"fmt"
	"github.com/abhiudayg/anode/internal/iag"
	"regexp"
	"strings"
)

var deployUserPattern = regexp.MustCompile(`^[a-z_][a-z0-9_-]{0,31}$`)

func HostSetup(root *SSHClient, deployUser string, publicKey string) error {
	if err := iag.ValidateLinuxAccount(deployUser); err != nil {
		return err
	}
	if !deployUserPattern.MatchString(deployUser) {
		return fmt.Errorf("invalid deploy user name %q", deployUser)
	}
	publicKey = strings.TrimSpace(publicKey)
	if !strings.HasPrefix(publicKey, "ssh-") || strings.ContainsAny(publicKey, "\r\n") {
		return fmt.Errorf("expected a single-line OpenSSH public key")
	}
	if !root.isRoot() {
		return fmt.Errorf("host setup must run as root")
	}

	home := "/home/" + deployUser
	steps := []string{
		fmt.Sprintf("id -u %s >/dev/null 2>&1 || useradd -m -s /bin/bash %s", deployUser, deployUser),
		fmt.Sprintf("install -d -m 700 -o %s -g %s %s/.ssh", deployUser, deployUser, home),
	}
	for _, cmd := range steps {
		if _, err := root.Run(cmd); err != nil {
			return fmt.Errorf("host setup step failed: %w", err)
		}
	}

	if err := root.StreamBytes([]byte(publicKey+"\n"), home+"/.ssh/authorized_keys", 0o600); err != nil {
		return fmt.Errorf("failed to install public key: %w", err)
	}
	if _, err := root.Run(fmt.Sprintf("chown %s:%s %s/.ssh/authorized_keys", deployUser, deployUser, home)); err != nil {
		return fmt.Errorf("failed to set key ownership: %w", err)
	}

	sudoers := fmt.Sprintf("%s ALL=(root) NOPASSWD: ALL\n", deployUser)
	if err := root.StreamBytes([]byte(sudoers), "/etc/sudoers.d/anode-deploy", 0o440); err != nil {
		return fmt.Errorf("failed to install sudo rule: %w", err)
	}
	if _, err := root.Run("visudo -cf /etc/sudoers.d/anode-deploy"); err != nil {
		_, _ = root.Run("rm -f /etc/sudoers.d/anode-deploy")
		return fmt.Errorf("sudo rule failed validation and was removed: %w", err)
	}
	return nil
}
