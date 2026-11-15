package deployer

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

func CheckRedisLimit(lockfile *iag.LockFile, cfg *projectconfig.File) error {
	if n := nativeRedisCount(lockfile, cfg); n > 1 {
		return fmt.Errorf("a project supports one native Redis install, found %d; run the others with runtime = \"docker\"", n)
	}
	return nil
}

func nativeRedisCount(lockfile *iag.LockFile, cfg *projectconfig.File) int {
	count := 0
	for id, res := range lockfile.Resources {
		if res.AutoProvision && res.Kind == "redis" && cfg.Stores[id].Runtime == projectconfig.RuntimeBinary {
			count++
		}
	}
	return count
}

func redisCountOf(lockfile *iag.LockFile) int {
	count := 0
	for _, res := range lockfile.Resources {
		if res.AutoProvision && res.Kind == "redis" {
			count++
		}
	}
	return count
}

func checkDeployInputs(lockfile *iag.LockFile, cfg *projectconfig.File, secrets map[string]string) error {
	if err := checkLockNames(lockfile); err != nil {
		return err
	}
	if err := CheckRedisLimit(lockfile, cfg); err != nil {
		return err
	}
	if redisCountOf(lockfile) == 1 {
		if err := validateRedisPassword(secrets[RedisPasswordKey()]); err != nil {
			return fmt.Errorf("%s in .env: %w", RedisPasswordKey(), err)
		}
	}
	for id, res := range lockfile.Resources {
		if !res.AutoProvision || cfg.Stores[id].Runtime != projectconfig.RuntimeDocker || catalog.NewRegistry().Resolve(string(res.Kind)).Runtime.PasswordEnv == "" {
			continue
		}
		key := ContainerSecretKey(id)
		if err := validatePassword(key, secrets[key]); err != nil {
			return fmt.Errorf("%s in .env: %w", key, err)
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
			if _, err := configBindingValue(string(res.Kind), b.ConfigKey, cfg.Managed(b.ResourceRef, res), port, secrets); err != nil {
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
			if !exists || cfg.Managed(b.ResourceRef, res) || res.Kind == "redis" {
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
	cfg, err := projectconfig.Load(rootDir)
	if err != nil {
		return err
	}
	return checkDeployInputs(lockfile, cfg, secrets)
}

func ContainerSecretKey(resID string) string {
	return strings.ToUpper(strings.ReplaceAll(resID, "-", "_")) + "_PASSWORD"
}

func checkLockNames(lockfile *iag.LockFile) error {
	for id, res := range lockfile.Resources {
		for _, topic := range res.Topics {
			if err := iag.ValidateKafkaTopic(topic); err != nil {
				return fmt.Errorf("resource %s: %w", id, err)
			}
		}
		for _, bucket := range res.Buckets {
			if err := iag.ValidateBucket(bucket); err != nil {
				return fmt.Errorf("resource %s: %w", id, err)
			}
		}
		for _, c := range res.Collections {
			if err := iag.ValidateCollection(c.Name); err != nil {
				return fmt.Errorf("resource %s: %w", id, err)
			}
			switch c.Distance {
			case "", "Cosine", "Euclid", "Dot", "Manhattan":
			default:
				return fmt.Errorf("resource %s: vector distance %q must be Cosine, Euclid, Dot, or Manhattan", id, c.Distance)
			}
		}
	}
	for name, svc := range lockfile.Services {
		for _, ing := range svc.Ingress {
			for _, route := range ing.Routes {
				if err := checkRoutePath(route); err != nil {
					return fmt.Errorf("service %s: %w", name, err)
				}
			}
		}
		for _, env := range svc.ConfigEnv {
			if err := iag.ValidateEnvName(env); err != nil {
				return fmt.Errorf("service %s: %w", name, err)
			}
		}
		for _, s := range svc.Secrets {
			if err := iag.ValidateEnvName(s.EnvVar); err != nil {
				return fmt.Errorf("service %s: %w", name, err)
			}
		}
	}
	return nil
}

var routePathPattern = regexp.MustCompile(`^(/[A-Za-z0-9._~/-]*)?$`)

func checkRoutePath(route string) error {
	path := route
	if parts := strings.Split(route, " "); len(parts) == 2 {
		path = parts[1]
	}
	if i := strings.Index(path, "{"); i >= 0 {
		path = path[:i]
	}
	if !routePathPattern.MatchString(strings.TrimSpace(path)) {
		return fmt.Errorf("route %q has characters that cannot appear in a Caddy path", route)
	}
	return nil
}
