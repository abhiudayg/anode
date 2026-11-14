package deployer

import "fmt"

const noRootDropIn = "/etc/ssh/sshd_config.d/99-anode-no-root.conf"

func VerifyDeployAccount(deploy Remote) error {
	if _, err := deploy.Run("true"); err != nil {
		return fmt.Errorf("deploy account cannot run commands: %w", err)
	}
	return nil
}

func DisableRootLogin(root Remote) error {
	if err := root.StreamBytes([]byte("PermitRootLogin no\n"), noRootDropIn, 0o644); err != nil {
		return fmt.Errorf("failed to write sshd setting: %w", err)
	}
	if _, err := root.Run("sshd -t"); err != nil {
		_, _ = root.Run("rm -f " + noRootDropIn)
		return fmt.Errorf("sshd rejected the new setting and it was removed: %w", err)
	}
	if _, err := root.Run("systemctl reload ssh 2>/dev/null || systemctl reload sshd"); err != nil {
		return fmt.Errorf("failed to reload sshd: %w", err)
	}
	return nil
}
