package deployer

import (
	"fmt"
	"path/filepath"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
)

func checkDeployInputs(lockfile *iag.LockFile, secrets map[string]string) error {
	redisCount := 0
	for _, res := range lockfile.Resources {
		if res.AutoProvision && res.Kind == "redis" {
			redisCount++
		}
	}
	if redisCount > 1 {
		return fmt.Errorf("a project supports one native Redis resource, found %d", redisCount)
	}
	if redisCount == 1 {
		if err := validateRedisPassword(secrets[RedisPasswordKey()]); err != nil {
			return fmt.Errorf("%s in .env: %w", RedisPasswordKey(), err)
		}
	}

	for svcName, svc := range lockfile.Services {
		for _, b := range svc.Bindings {
			if b.ConfigKey == "" {
				continue
			}
			res, exists := lockfile.Resources[b.ResourceRef]
			if !exists {
				return fmt.Errorf("service %s binds %s, which is not a declared resource", svcName, b.ResourceRef)
			}
			port := catalog.NewRegistry().Resolve(string(res.Kind)).Networking.PrimaryPort
			if _, err := configBindingValue(string(res.Kind), b.ConfigKey, res.AutoProvision, port, secrets); err != nil {
				return fmt.Errorf("service %s: %w", svcName, err)
			}
			if svc.ConfigFile == "" {
				return fmt.Errorf("service %s reads %s from a config file, but no config file path was found in its code", svcName, b.ConfigKey)
			}
		}
	}

	for svcName, svc := range lockfile.Services {
		for _, s := range svc.Secrets {
			if secrets[s.EnvVar] == "" {
				return fmt.Errorf("service %s needs %s, which is missing from .env", svcName, s.EnvVar)
			}
		}
	}

	for svcName, svc := range lockfile.Services {
		for _, b := range svc.Bindings {
			if b.ConfigKey != "" {
				continue
			}
			res, exists := lockfile.Resources[b.ResourceRef]
			if !exists || res.AutoProvision || res.Kind == "redis" {
				continue
			}
			key := BindingEnvKey(svc.Name, b)
			if secrets[key] == "" {
				return fmt.Errorf("service %s needs %s in .env (the connection string for %s)", svcName, key, b.ResourceRef)
			}
		}
	}
	return nil
}

func DeployInputs(lockfile *iag.LockFile, rootDir string) error {
	if err := checkDotEnvPermissions(rootDir); err != nil {
		return err
	}
	secrets, err := ReadDotEnv(filepath.Join(rootDir, ".env"))
	if err != nil {
		return fmt.Errorf("failed to read .env: %w", err)
	}
	return checkDeployInputs(lockfile, secrets)
}
