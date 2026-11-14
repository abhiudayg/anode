package deployer

import (
	"fmt"
	"path/filepath"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
)

type Bootstrapper struct {
	ssh Remote
}

func NewBootstrapper(sshClient Remote) *Bootstrapper {
	return &Bootstrapper{ssh: sshClient}
}

// BootstrapServer idempotently sets up /var/lib/anode, Caddy, and stateful databases
func (b *Bootstrapper) BootstrapServer(lockfile *iag.LockFile, secrets map[string]string) error {
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
		return fmt.Errorf("caddy is not available on the host: %w", err)
	}

	if _, err := b.ssh.Run(appPortFirewallCommand()); err != nil {
		return fmt.Errorf("could not restrict application ports to loopback: %w", err)
	}

	// 2. Provision Auto-Provisioned Stateful Dependencies via Pluggable Least-Privilege Catalog
	reg := catalog.NewRegistry()
	for resID, res := range lockfile.Resources {
		if res.AutoProvision && res.Kind == "redis" {
			port := reg.Resolve(string(res.Kind)).Networking.PrimaryPort
			if err := b.provisionNativeRedis(resID, port, secrets[RedisPasswordKey()]); err != nil {
				return err
			}
			continue
		}
		if !res.AutoProvision {
			continue
		}

		driver := reg.Resolve(string(res.Kind))
		version := driver.ResolveEffectiveVersion(res.EngineVersion)
		image := driver.ResolveImage(version)
		dataPath := fmt.Sprintf("/var/lib/anode/data/%s", resID)

		fmt.Printf("  ⚙ Bootstrapping production stateful %s (%s, version: %s, image: %s)...\n", resID, res.Kind, version, image)
		provisionCmd := driver.BuildProvisionCommand(resID, version, dataPath)

		if _, err := b.ssh.Run(provisionCmd); err != nil {
			return fmt.Errorf("failed to provision stateful resource %s: %w", resID, err)
		}
	}

	return nil
}

// WriteRemoteFile securely writes content to a remote path via SCP binary streaming, eliminating here-doc shell injection
func (b *Bootstrapper) WriteRemoteFile(content string, remotePath string) error {
	dir := filepath.Dir(remotePath)
	if _, err := b.ssh.Run(fmt.Sprintf("mkdir -p '%s'", dir)); err != nil {
		return fmt.Errorf("failed to create remote directory %s: %w", dir, err)
	}
	return b.ssh.StreamBytes([]byte(content), remotePath, 0644)
}
