package deployer

import (
	"fmt"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

type Bootstrapper struct {
	ssh *SSHClient
}

func NewBootstrapper(sshClient *SSHClient) *Bootstrapper {
	return &Bootstrapper{ssh: sshClient}
}

// BootstrapServer idempotently sets up /var/lib/anode, Caddy, and stateful databases
func (b *Bootstrapper) BootstrapServer(lockfile *iag.LockFile) error {
	fmt.Println("  ⚙ Verifying remote host directories...")
	setupDirsCmd := `id -u anode &>/dev/null || useradd -r -s /bin/false anode && \
                     mkdir -p /var/lib/anode/bin \
                              /var/lib/anode/releases \
                              /var/lib/anode/data \
                              /var/lib/anode/caddy \
                              /etc/systemd/system && \
                     chown -R anode:anode /var/lib/anode`
	if _, err := b.ssh.Run(setupDirsCmd); err != nil {
		return fmt.Errorf("failed to create directory structure on host: %w", err)
	}

	// 1. Ensure Caddy is installed
	fmt.Println("  ⚙ Checking Caddy reverse proxy...")
	checkCaddyCmd := `which caddy || (
		apt-get update -qq && apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl && \
		curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
		curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list && \
		apt-get update -qq && apt-get install -y -qq caddy
	)`
	if _, err := b.ssh.Run(checkCaddyCmd); err != nil {
		fmt.Printf("    ⚠ Warning: Automatic Caddy installation had notice: %v\n", err)
	}

	// 2. Provision Auto-Provisioned Stateful Databases (e.g. Postgres in isolated Docker/Podman)
	for resID, res := range lockfile.Resources {
		if res.AutoProvision && res.Kind == iag.KindPostgres {
			fmt.Printf("  ⚙ Bootstrapping production stateful Postgres for %s...\n", resID)
			containerName := fmt.Sprintf("anode-%s", resID)
			dataPath := fmt.Sprintf("/var/lib/anode/data/%s", resID)

			dbCmd := fmt.Sprintf(`mkdir -p %s && (docker ps -q -f name=%s | grep -q . || docker run -d \
				--name %s \
				--restart always \
				-p 127.0.0.1:5432:5432 \
				-v %s:/var/lib/postgresql/data \
				-e POSTGRES_USER=postgres \
				-e POSTGRES_PASSWORD=postgres \
				-e POSTGRES_DB=%s \
				postgres:16-alpine)`, dataPath, containerName, containerName, dataPath, resID)

			if _, err := b.ssh.Run(dbCmd); err != nil {
				// Non-fatal if host already has postgres or uses external RDS
				fmt.Printf("    ℹ Notice: Host DB container setup: %v\n", err)
			}
		}
	}

	return nil
}

// WriteRemoteFile writes content directly to a remote path over SSH
func (b *Bootstrapper) WriteRemoteFile(content string, remotePath string) error {
	escaped := strings.ReplaceAll(content, "'", "'\\''")
	cmd := fmt.Sprintf("cat << 'EOF' > %s\n%s\nEOF", remotePath, escaped)
	_, err := b.ssh.Run(cmd)
	return err
}
