package main

import (
	"fmt"
	"io"
	"net"
	"path/filepath"
	"sort"

	"golang.org/x/crypto/ssh"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/devengine"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func migrationEngine(kind string) (driver, dialect string, ok bool) {
	switch kind {
	case "postgres", "timescaledb", "cockroachdb":
		return "pgx", "postgres", true
	case "mysql", "mariadb":
		return "mysql", "mysql", true
	}
	return "", "", false
}

func runMigrate(host, targetDir string) error {
	lockfile, err := loadOrInspect(targetDir)
	if err != nil {
		return err
	}
	cfg, err := projectconfig.Load(targetDir)
	if err != nil {
		return err
	}
	if err := cfg.Validate(lockfile); err != nil {
		return err
	}
	secrets, err := deployer.ReadDotEnv(filepath.Join(targetDir, ".env"))
	if err != nil {
		return fmt.Errorf("failed to read .env: %w", err)
	}
	var remote *ssh.Client
	if host != "" {
		sshClient, err := deployer.DialSSH(host)
		if err != nil {
			return fmt.Errorf("SSH connection to %s failed: %w", host, err)
		}
		defer sshClient.Close()
		remote = sshClient.Client()
	}
	runner := devengine.NewMigrationRunner(targetDir)
	for _, id := range sortedResourceIDs(lockfile) {
		res := lockfile.Resources[id]
		if res.Migrations == nil || res.Migrations.Path == "" {
			continue
		}
		driver, dialect, ok := migrationEngine(string(res.Kind))
		if !ok {
			return fmt.Errorf("%s: anode migrate has no migration engine for kind %s", id, res.Kind)
		}
		dsn, cleanup, err := migrationDSN(id, res, lockfile, cfg, secrets, remote)
		if err != nil {
			return err
		}
		applied, err := runner.RunGooseMigrationsFor(driver, dialect, dsn, res.Migrations.Path)
		cleanup()
		if err != nil {
			return fmt.Errorf("migrations for %s: %w", id, err)
		}
		fmt.Printf("  ✓ %s: applied %d migration(s) from %s\n", id, applied, res.Migrations.Path)
	}
	return nil
}

func migrationDSN(id string, res iag.Resource, lockfile *iag.LockFile, cfg *projectconfig.File, secrets map[string]string, remote *ssh.Client) (string, func(), error) {
	noop := func() {}
	if cfg.Stores[id].Runtime == projectconfig.RuntimeExternal {
		key := connectionKeyFor(lockfile, id)
		dsn := secrets[key]
		if dsn == "" {
			return "", noop, fmt.Errorf("%s is missing from .env (the connection string for %s)", key, id)
		}
		return dsn, noop, nil
	}
	if cfg.Stores[id].Runtime != projectconfig.RuntimeDocker {
		return "", noop, fmt.Errorf("%s: anode migrate reaches only external and docker stores", id)
	}
	if remote == nil {
		return "", noop, fmt.Errorf("%s runs on the host; pass the target: anode migrate root@<host> [path]", id)
	}
	hostPort := cfg.Stores[id].HostPort
	if hostPort == 0 {
		return "", noop, fmt.Errorf("%s has no host_port in anode.toml; deploy once to assign it", id)
	}
	localPort, cleanup, err := forwardLocal(remote, fmt.Sprintf("127.0.0.1:%d", hostPort))
	if err != nil {
		return "", noop, fmt.Errorf("forward port for %s: %w", id, err)
	}
	driver := catalog.NewRegistry().Resolve(string(res.Kind))
	dsn, err := driver.PrimaryConnectionValue(id, "127.0.0.1", localPort, id, secrets[deployer.ContainerSecretKey(id)])
	if err != nil {
		cleanup()
		return "", noop, err
	}
	return dsn, cleanup, nil
}

func forwardLocal(remote *ssh.Client, remoteAddr string) (int, func(), error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, nil, err
	}
	go func() {
		for {
			local, err := listener.Accept()
			if err != nil {
				return
			}
			go func() {
				far, err := remote.Dial("tcp", remoteAddr)
				if err != nil {
					local.Close()
					return
				}
				go func() { _, _ = io.Copy(far, local); far.Close() }()
				go func() { _, _ = io.Copy(local, far); local.Close() }()
			}()
		}
	}()
	return listener.Addr().(*net.TCPAddr).Port, func() { listener.Close() }, nil
}

func sortedResourceIDs(lockfile *iag.LockFile) []string {
	ids := make([]string, 0, len(lockfile.Resources))
	for id := range lockfile.Resources {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

func connectionKeyFor(lockfile *iag.LockFile, resourceID string) string {
	names := make([]string, 0, len(lockfile.Services))
	for name := range lockfile.Services {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		for _, b := range lockfile.Services[name].Bindings {
			if b.ResourceRef == resourceID {
				return deployer.BindingEnvKey(name, b)
			}
		}
	}
	return ""
}
