package main

import (
	"fmt"
	"io"
	"net"
	"path/filepath"
	"sort"
	"strings"

	"golang.org/x/crypto/ssh"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/devengine"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/migrations"
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
		applied, err := applyResourceMigrations(targetDir, id, res, cfg, lockfile, secrets, remote, runner)
		if err != nil {
			return fmt.Errorf("migrations for %s: %w", id, err)
		}
		fmt.Printf("  ✓ %s: applied %d migration(s) from %s\n", id, applied, res.Migrations.Path)
	}
	return nil
}

func migrationDSN(rootDir, id string, res iag.Resource, lockfile *iag.LockFile, cfg *projectconfig.File, secrets map[string]string, remote *ssh.Client) (string, func(), error) {
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
	state, err := deployer.LoadState(rootDir)
	if err != nil {
		return "", noop, err
	}
	hostPort := state.HostPorts[id]
	if hostPort == 0 {
		return "", noop, fmt.Errorf("%s has no host port in %s; deploy once to assign it", id, deployer.StateFileName)
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

func applyResourceMigrations(targetDir, id string, res iag.Resource, cfg *projectconfig.File, lockfile *iag.LockFile, secrets map[string]string, remote *ssh.Client, runner *devengine.MigrationRunner) (int, error) {
	switch string(res.Kind) {
	case "clickhouse":
		return applyClickHouseMigrations(targetDir, id, res, lockfile, secrets, remote)
	case "scylladb":
		return applyScyllaMigrations(targetDir, id, res, cfg, lockfile, secrets, remote)
	}
	driver, dialect, ok := migrationEngine(string(res.Kind))
	if !ok {
		return 0, fmt.Errorf("anode migrate has no migration engine for kind %s", res.Kind)
	}
	dsn, cleanup, err := migrationDSN(targetDir, id, res, lockfile, cfg, secrets, remote)
	if err != nil {
		return 0, err
	}
	defer cleanup()
	return runner.RunGooseMigrationsFor(driver, dialect, dsn, res.Migrations.Path)
}

func applyClickHouseMigrations(targetDir, id string, res iag.Resource, lockfile *iag.LockFile, secrets map[string]string, remote *ssh.Client) (int, error) {
	prefix := strings.TrimSuffix(connectionKeyFor(lockfile, id), "_ADDR")
	httpAddr := secrets[prefix+"_HTTP_ADDR"]
	if httpAddr == "" {
		return 0, fmt.Errorf("%s_HTTP_ADDR is missing from .env (the HTTP address of the ClickHouse server, usually port 8123)", prefix)
	}
	database := secrets[prefix+"_DB"]
	if database == "" {
		return 0, fmt.Errorf("%s_DB is missing from .env (the database that holds this store's tables)", prefix)
	}
	endpoint, cleanup, err := reachable(remote, httpAddr)
	if err != nil {
		return 0, err
	}
	defer cleanup()
	user := secrets[prefix+"_USER"]
	if user == "" {
		user = "default"
	}
	runner := migrations.ClickHouse{
		Endpoint: "http://" + endpoint,
		Database: database,
		User:     user,
		Password: secrets[prefix+"_PASSWORD"],
	}
	return runner.Apply(filepath.Join(targetDir, res.Migrations.Path))
}

func applyScyllaMigrations(targetDir, id string, res iag.Resource, cfg *projectconfig.File, lockfile *iag.LockFile, secrets map[string]string, remote *ssh.Client) (int, error) {
	key := connectionKeyFor(lockfile, id)
	prefix := strings.TrimSuffix(key, "_HOSTS")
	first := strings.TrimSpace(strings.Split(secrets[key], ",")[0])
	if first == "" {
		return 0, fmt.Errorf("%s is missing from .env (the contact point for %s)", key, id)
	}
	keyspace := secrets[prefix+"_KEYSPACE"]
	if keyspace == "" {
		return 0, fmt.Errorf("%s_KEYSPACE is missing from .env (the keyspace the service reads)", prefix)
	}
	endpoint, cleanup, err := reachable(remote, first)
	if err != nil {
		return 0, err
	}
	defer cleanup()
	host, port, err := net.SplitHostPort(endpoint)
	if err != nil {
		return 0, err
	}
	image := catalog.NewRegistry().Resolve("scylladb").ResolveImage(cfg.Stores[id].Version)
	runner := migrations.Scylla{
		Image:    image,
		Host:     host,
		Port:     port,
		Keyspace: keyspace,
		User:     secrets[prefix+"_USER"],
		Password: secrets[prefix+"_PASSWORD"],
	}
	return runner.Apply(filepath.Join(targetDir, res.Migrations.Path))
}

func reachable(remote *ssh.Client, addr string) (string, func(), error) {
	noop := func() {}
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return "", noop, fmt.Errorf("%s: %w", addr, err)
	}
	if remote == nil || (host != "127.0.0.1" && host != "localhost") {
		return addr, noop, nil
	}
	port, cleanup, err := forwardLocal(remote, addr)
	if err != nil {
		return "", noop, fmt.Errorf("forward %s: %w", addr, err)
	}
	return fmt.Sprintf("127.0.0.1:%d", port), cleanup, nil
}
