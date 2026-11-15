package deployer

import (
	"fmt"
	"path/filepath"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

type Bootstrapper struct {
	ssh Remote
}

func NewBootstrapper(sshClient Remote) *Bootstrapper {
	return &Bootstrapper{ssh: sshClient}
}

// BootstrapServer idempotently sets up /var/lib/anode, Caddy, and stateful databases
func (b *Bootstrapper) BootstrapServer(lockfile *iag.LockFile, cfg *projectconfig.File, secrets map[string]string) error {
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

	if usesDockerStore(lockfile, cfg) {
		fmt.Println("  ⚙ Checking Docker for container stores...")
		checkDockerCmd := `command -v docker >/dev/null 2>&1 || (
		DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io
	) && systemctl enable --now docker`
		if _, err := b.ssh.Run(checkDockerCmd); err != nil {
			return fmt.Errorf("docker is not available on the host: %w", err)
		}
	}

	if _, err := b.ssh.Run(appPortFirewallCommand()); err != nil {
		return fmt.Errorf("could not restrict application ports to loopback: %w", err)
	}

	// 2. Provision Auto-Provisioned Stateful Dependencies via Pluggable Least-Privilege Catalog
	reg := catalog.NewRegistry()
	for resID, res := range lockfile.Resources {
		if !res.AutoProvision {
			continue
		}
		store, ok := cfg.Stores[resID]
		if !ok {
			return fmt.Errorf("stores.%q is missing from anode.toml", resID)
		}
		driver := reg.Resolve(string(res.Kind))

		if store.Runtime == projectconfig.RuntimeBinary {
			port := driver.Networking.PrimaryPort
			if err := b.provisionNativeRedis(resID, port, secrets[RedisPasswordKey()], store.Version); err != nil {
				return err
			}
			continue
		}

		image := store.Image
		if image == "" {
			image = driver.ResolveImage(store.Version)
		}
		dataPath := fmt.Sprintf("/var/lib/anode/data/%s", resID)

		fmt.Printf("  ⚙ Bootstrapping production stateful %s (%s, version: %s, image: %s)...\n", resID, res.Kind, store.Version, image)
		provisionCmd := driver.BuildProvisionCommand(resID, store.Version, dataPath)

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

func usesDockerStore(lockfile *iag.LockFile, cfg *projectconfig.File) bool {
	for id, res := range lockfile.Resources {
		if res.AutoProvision && cfg.Stores[id].Runtime == projectconfig.RuntimeDocker {
			return true
		}
	}
	return false
}
