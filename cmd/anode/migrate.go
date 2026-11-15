package main

import (
	"fmt"
	"path/filepath"
	"sort"

	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/devengine"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func runMigrate(targetDir string) error {
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
	runner := devengine.NewMigrationRunner(targetDir)
	for _, id := range sortedResourceIDs(lockfile) {
		res := lockfile.Resources[id]
		if res.Migrations == nil || res.Migrations.Path == "" {
			continue
		}
		if res.Kind != "postgres" {
			return fmt.Errorf("%s: anode migrate runs goose for postgres only", id)
		}
		if cfg.Stores[id].Runtime != projectconfig.RuntimeExternal {
			return fmt.Errorf("%s is managed by anode; its migrations run where the store is provisioned, not from this command", id)
		}
		key := connectionKeyFor(lockfile, id)
		dsn := secrets[key]
		if dsn == "" {
			return fmt.Errorf("%s is missing from .env (the connection string for %s)", key, id)
		}
		applied, err := runner.RunGooseMigrations(dsn, res.Migrations.Path)
		if err != nil {
			return fmt.Errorf("migrations for %s: %w", id, err)
		}
		fmt.Printf("  ✓ %s: applied %d migration(s) from %s\n", id, applied, res.Migrations.Path)
	}
	return nil
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
