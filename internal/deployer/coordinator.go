package deployer

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

type DeployCoordinator struct {
	rootDir  string
	ssh      Remote
	lockfile *iag.LockFile
}

func NewDeployCoordinator(rootDir string, sshClient Remote, lockfile *iag.LockFile) *DeployCoordinator {
	return &DeployCoordinator{
		rootDir:  rootDir,
		ssh:      sshClient,
		lockfile: lockfile,
	}
}

// Deploy uploads a release, restarts each service in place with a health check, and reloads the Caddy edge on the remote VPS
func (d *DeployCoordinator) Deploy(ctx context.Context, domain string) error {
	bootstrapper := NewBootstrapper(d.ssh)
	releaseID := fmt.Sprintf("%d", time.Now().Unix())

	// Validate topology identifiers to prevent shell injection
	for name, svc := range d.lockfile.Services {
		if err := iag.ValidateIdentifier("service", name); err != nil {
			return err
		}
		if err := iag.ValidateIdentifier("service", svc.Name); err != nil {
			return err
		}
	}
	for resID := range d.lockfile.Resources {
		if err := iag.ValidateIdentifier("resource", resID); err != nil {
			return err
		}
	}

	if err := checkDotEnvPermissions(d.rootDir); err != nil {
		return err
	}
	secrets, err := ReadDotEnv(filepath.Join(d.rootDir, ".env"))
	if err != nil {
		return fmt.Errorf("failed to read .env: %w", err)
	}
	cfg, err := projectconfig.Load(d.rootDir)
	if err != nil {
		return err
	}
	if err := checkDeployInputs(d.lockfile, cfg, secrets); err != nil {
		return err
	}
	if err := cfg.Validate(d.lockfile); err != nil {
		return err
	}
	hostPorts := containerHostPorts(d.lockfile, cfg)

	// 1. Remote Host Bootstrap
	fmt.Println("🚀 Step 1: Bootstrapping remote host...")
	if err := bootstrapper.BootstrapServer(d.lockfile, cfg, secrets); err != nil {
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
	reg := catalog.NewRegistry()
	reg.LoadProjectOverrides(d.rootDir)

	servicePortMap, err := d.allocateHostPorts()
	if err != nil {
		return err
	}

	for name, svc := range d.lockfile.Services {
		port := servicePortMap[name]
		remoteBin := fmt.Sprintf("%s/%s", remoteReleaseDir, name)

		envVars := map[string]string{
			"PORT": fmt.Sprintf("%d", port),
		}

		secretEnv := map[string]string{}
		configValues := map[string]string{}

		// Inject DB bindings via catalog templates
		for _, b := range svc.Bindings {
			if b.ConfigKey != "" {
				res := d.lockfile.Resources[b.ResourceRef]
				port := reg.Resolve(string(res.Kind)).Networking.PrimaryPort
				value, err := configBindingValue(string(res.Kind), b.ConfigKey, cfg.Managed(b.ResourceRef, res), port, secrets)
				if err != nil {
					return err
				}
				configValues[b.ConfigKey] = value
				continue
			}
			if b.ResourceRef == "" {
				continue
			}
			envKey := BindingEnvKey(svc.Name, b)

			if res, exists := d.lockfile.Resources[b.ResourceRef]; exists {
				if res.Kind == "redis" && !strings.HasSuffix(envKey, "_ADDR") {
					port := reg.Resolve(string(res.Kind)).Networking.PrimaryPort
					secretEnv[envKey] = RedisConnectionURL(secrets[RedisPasswordKey()], port)
					continue
				}
				if !cfg.Managed(b.ResourceRef, res) {
					value := secrets[envKey]
					if value == "" {
						return fmt.Errorf("%s is missing from .env (the connection string for %s)", envKey, b.ResourceRef)
					}
					secretEnv[envKey] = value
					continue
				}
				driver := reg.Resolve(string(res.Kind))
				value, err := driver.PrimaryConnectionValue(b.ResourceRef, "127.0.0.1", hostPortFor(hostPorts, b.ResourceRef, driver), b.ResourceRef, secrets[ContainerSecretKey(b.ResourceRef)])
				if err != nil {
					return err
				}
				secretEnv[envKey] = value
			} else {
				return fmt.Errorf("service %s binds %s, which is not a declared resource", svc.Name, b.ResourceRef)
			}
		}

		var preStart []string
		if len(configValues) > 0 {
			if svc.ConfigFile == "" || strings.Contains(svc.ConfigFile, "/") {
				return fmt.Errorf("service %s has an invalid config file path %q", svc.Name, svc.ConfigFile)
			}
			doc, err := BuildConfigDocument(configValues)
			if err != nil {
				return err
			}
			if _, err := d.ssh.Run("mkdir -p -m 700 /etc/anode/env"); err != nil {
				return fmt.Errorf("failed to create env directory: %w", err)
			}
			configSrc := fmt.Sprintf("/etc/anode/env/%s.%s.config.json", releaseID, svc.Name)
			if err := bootstrapper.WriteRemoteFile(string(doc), configSrc); err != nil {
				return fmt.Errorf("failed to write config for %s: %w", svc.Name, err)
			}
			if _, err := d.ssh.Run(fmt.Sprintf("chmod 0600 '%s'", configSrc)); err != nil {
				return fmt.Errorf("failed to lock down config for %s: %w", svc.Name, err)
			}
			handoff, err := configHandoffCommand(svc.Name, configSrc, svc.ConfigFile)
			if err != nil {
				return err
			}
			preStart = append(preStart, handoff)
		}

		// Inject inter-service discovery URLs
		for otherName, otherPort := range servicePortMap {
			if otherName != name {
				envKey := envName(otherName) + "_SERVICE_URL"
				envVars[envKey] = fmt.Sprintf("http://127.0.0.1:%d", otherPort)
			}
		}

		// Inject and isolate secrets into a secured 0600 environment file
		for _, s := range svc.Secrets {
			value := secrets[s.EnvVar]
			secretEnv[s.EnvVar] = value
			delete(envVars, s.EnvVar)
		}

		envFilePath := ""
		if len(secretEnv) > 0 {
			keys := make([]string, 0, len(secretEnv))
			for k := range secretEnv {
				keys = append(keys, k)
			}
			sort.Strings(keys)
			var envFileContent strings.Builder
			for _, k := range keys {
				envFileContent.WriteString(fmt.Sprintf("%s=%s\n", k, secretEnv[k]))
			}
			if _, err := d.ssh.Run("mkdir -p -m 700 /etc/anode/env"); err != nil {
				return fmt.Errorf("failed to create env directory: %w", err)
			}
			remoteEnvPath := fmt.Sprintf("/etc/anode/env/%s.%s", releaseID, svc.Name)
			if err := d.ssh.StreamBytes([]byte(envFileContent.String()), remoteEnvPath, 0o600); err != nil {
				return fmt.Errorf("failed to write env file for %s: %w", svc.Name, err)
			}
			envFilePath = remoteEnvPath
		}

		unitContent, err := GenerateSystemdUnit(SystemdUnitConfig{
			ServiceName: svc.Name,
			Description: fmt.Sprintf("Anode %s (release %s)", svc.Name, releaseID),
			ExecStart:   remoteBin,
			StateDir:    svc.Name,
			PreStart:    preStart,
			EnvVars:     envVars,
			EnvFile:     envFilePath,
		})
		if err != nil {
			return err
		}

		if err := bootstrapper.WriteRemoteFile(unitContent, remoteReleaseDir+"/anode-"+svc.Name+".service"); err != nil {
			return fmt.Errorf("failed to record unit for %s: %w", svc.Name, err)
		}
		unitPath := fmt.Sprintf("/etc/systemd/system/anode-%s.service", svc.Name)
		if err := bootstrapper.WriteRemoteFile(unitContent, unitPath); err != nil {
			return fmt.Errorf("failed to write systemd unit for %s: %w", svc.Name, err)
		}

		// Reload and restart systemd unit
		reloadCmd := fmt.Sprintf("systemctl daemon-reload && systemctl restart 'anode-%s.service'", svc.Name)
		if _, err := d.ssh.Run(reloadCmd); err != nil {
			return fmt.Errorf("failed to start systemd service %s: %w", svc.Name, err)
		}

		activeCmd := fmt.Sprintf("sleep 2 && systemctl is-active --quiet 'anode-%s.service'", svc.Name)
		if _, err := d.ssh.Run(activeCmd); err != nil {
			return fmt.Errorf("service %s is not running after restart (check: journalctl -u anode-%s.service): %w", svc.Name, svc.Name, err)
		}
		if hasHTTPService(svc) {
			if _, err := d.ssh.Run(httpHealthCommand(port)); err != nil {
				return fmt.Errorf("service %s does not pass GET %s on port %d: add the route, or check journalctl -u anode-%s.service: %w", svc.Name, healthPath, port, svc.Name, err)
			}
		}
		fmt.Printf("  ✓ Service %s running on 127.0.0.1:%d\n", name, port)
	}

	// 5. Caddy Edge Proxy Route Flip
	fmt.Println("🌐 Step 5: Configuring Caddy edge reverse proxy & TLS...")
	caddyContent := GenerateCaddyfile(domain, d.lockfile, servicePortMap)
	caddyPath := "/etc/caddy/Caddyfile"
	if err := bootstrapper.WriteRemoteFile(caddyContent, caddyPath); err != nil {
		return fmt.Errorf("failed to write Caddyfile: %w", err)
	}

	if _, err := d.ssh.Run("caddy validate --config /etc/caddy/Caddyfile"); err != nil {
		return fmt.Errorf("Caddyfile is invalid: %w", err)
	}
	if _, err := d.ssh.Run("systemctl reload caddy || systemctl restart caddy"); err != nil {
		return fmt.Errorf("failed to reload Caddy: %w", err)
	}

	keepUnits := make(map[string]bool)
	for name := range d.lockfile.Services {
		keepUnits["anode-"+name+".service"] = true
	}
	for resID, res := range d.lockfile.Resources {
		if res.AutoProvision && res.Kind == "redis" {
			keepUnits["anode-"+resID+".service"] = true
		}
	}
	if err := d.pruneHost(keepUnits); err != nil {
		return err
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
	entryDir, err := iag.SafeResolvePath(d.rootDir, svc.Entrypoint)
	if err != nil {
		return "", fmt.Errorf("invalid service entrypoint for %s: %w", svc.Name, err)
	}
	if err := iag.ValidateIdentifier("service", svc.Name); err != nil {
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
