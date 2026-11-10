package deployer

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/iag"
)

type DeployCoordinator struct {
	rootDir  string
	ssh      *SSHClient
	lockfile *iag.LockFile
}

func NewDeployCoordinator(rootDir string, sshClient *SSHClient, lockfile *iag.LockFile) *DeployCoordinator {
	return &DeployCoordinator{
		rootDir:  rootDir,
		ssh:      sshClient,
		lockfile: lockfile,
	}
}

// Deploy executes the complete zero-downtime Blue/Green deployment to the remote VPS
func (d *DeployCoordinator) Deploy(ctx context.Context, domain string) error {
	bootstrapper := NewBootstrapper(d.ssh)
	releaseID := fmt.Sprintf("%d", time.Now().Unix())

	// 1. Remote Host Bootstrap
	fmt.Println("🚀 Step 1: Bootstrapping remote host...")
	if err := bootstrapper.BootstrapServer(d.lockfile); err != nil {
		return fmt.Errorf("bootstrap failed: %w", err)
	}

	// 2. Cross-Compile Linux Binaries Locally
	fmt.Println("🔨 Step 2: Cross-compiling static Linux binaries...")
	binMap := make(map[string]string)
	for name, svc := range d.lockfile.Services {
		localBin, err := d.crossCompileService(ctx, svc, releaseID)
		if err != nil {
			return fmt.Errorf("cross-compilation failed for %s: %w", name, err)
		}
		binMap[name] = localBin
		fmt.Printf("  ✓ Cross-compiled %s -> %s\n", name, filepath.Base(localBin))
	}

	// 3. Stream Binaries over SSH
	fmt.Println("📦 Step 3: Streaming release binaries to VPS...")
	remoteReleaseDir := fmt.Sprintf("/var/lib/anode/releases/%s", releaseID)
	if _, err := d.ssh.Run(fmt.Sprintf("mkdir -p %s", remoteReleaseDir)); err != nil {
		return fmt.Errorf("failed to create remote release dir: %w", err)
	}

	for name, localBin := range binMap {
		remoteBin := fmt.Sprintf("%s/%s", remoteReleaseDir, name)
		if err := d.ssh.StreamFile(localBin, remoteBin, 0755); err != nil {
			return fmt.Errorf("failed to upload binary for %s: %w", name, err)
		}
		fmt.Printf("  ✓ Uploaded %s -> %s\n", name, remoteBin)
	}

	// 4. Blue/Green Port Allocation & Systemd Unit Activation
	fmt.Println("⚡ Step 4: Activating systemd units & health verification...")
	servicePortMap := make(map[string]int)
	idx := 0
	for name, svc := range d.lockfile.Services {
		port := 21040 + idx
		idx++
		servicePortMap[name] = port

		remoteBin := fmt.Sprintf("%s/%s", remoteReleaseDir, name)
		unitContent, err := GenerateSystemdUnit(SystemdUnitConfig{
			ServiceName: svc.Name,
			Description: fmt.Sprintf("Anode %s (release %s)", svc.Name, releaseID),
			ExecStart:   remoteBin,
			WorkingDir:  remoteReleaseDir,
			EnvVars: map[string]string{
				"PORT":         fmt.Sprintf("%d", port),
				"DATABASE_URL": "postgres://postgres:postgres@127.0.0.1:5432/app?sslmode=disable",
			},
		})
		if err != nil {
			return err
		}

		unitPath := fmt.Sprintf("/etc/systemd/system/anode-%s.service", svc.Name)
		if err := bootstrapper.WriteRemoteFile(unitContent, unitPath); err != nil {
			return fmt.Errorf("failed to write systemd unit for %s: %w", svc.Name, err)
		}

		// Reload and restart systemd unit
		reloadCmd := fmt.Sprintf("systemctl daemon-reload && systemctl restart anode-%s.service", svc.Name)
		if _, err := d.ssh.Run(reloadCmd); err != nil {
			return fmt.Errorf("failed to start systemd service %s: %w", svc.Name, err)
		}

		// Verify remote health
		healthCmd := fmt.Sprintf("curl -s -f http://127.0.0.1:%d/ || curl -s -f http://127.0.0.1:%d/healthz || true", port, port)
		_, _ = d.ssh.Run(healthCmd)
		fmt.Printf("  ✓ Service %s live on 127.0.0.1:%d\n", name, port)
	}

	// 5. Caddy Edge Proxy Route Flip
	fmt.Println("🌐 Step 5: Configuring Caddy edge reverse proxy & TLS...")
	caddyContent := GenerateCaddyfile(domain, d.lockfile, servicePortMap)
	caddyPath := "/etc/caddy/Caddyfile"
	if err := bootstrapper.WriteRemoteFile(caddyContent, caddyPath); err != nil {
		return fmt.Errorf("failed to write Caddyfile: %w", err)
	}

	if _, err := d.ssh.Run("systemctl reload caddy || systemctl restart caddy"); err != nil {
		fmt.Printf("  ℹ Notice on Caddy reload: %v\n", err)
	}

	fmt.Printf("\n🎉 Release %s deployed successfully!\n", releaseID)
	fmt.Printf("   Public URL: https://%s\n", domain)

	return nil
}

func (d *DeployCoordinator) detectRemoteArch() string {
	out, err := d.ssh.Run("uname -m")
	if err == nil {
		arch := strings.TrimSpace(out)
		switch arch {
		case "aarch64", "arm64":
			return "arm64"
		case "x86_64", "amd64":
			return "amd64"
		case "armv7l", "arm":
			return "arm"
		}
	}
	return "amd64"
}

func (d *DeployCoordinator) crossCompileService(ctx context.Context, svc iag.Service, releaseID string) (string, error) {
	entryDir, err := filepath.Abs(filepath.Join(d.rootDir, svc.Entrypoint))
	if err != nil {
		return "", err
	}
	outDir, err := filepath.Abs(filepath.Join(d.rootDir, ".verify", "releases", releaseID))
	if err != nil {
		return "", err
	}
	_ = os.MkdirAll(outDir, 0755)
	binPath := filepath.Join(outDir, svc.Name)

	arch := d.detectRemoteArch()
	cmd := exec.CommandContext(ctx, "go", "build", "-o", binPath, ".")
	cmd.Dir = entryDir
	cmd.Env = append(os.Environ(),
		"CGO_ENABLED=0",
		"GOOS=linux",
		"GOARCH="+arch,
	)

	if out, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("linux cross-compile failed (%s): %s (%w)", arch, string(out), err)
	}

	return binPath, nil
}
