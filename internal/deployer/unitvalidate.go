package deployer

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	envKeyPattern        = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]{0,127}$`)
	configFilePattern    = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.json$`)
	unsafeUnitCharacters = "\n\r\x00"
)

func validateUnitConfig(cfg SystemdUnitConfig) error {
	singleLine := map[string]string{
		"service name": cfg.ServiceName,
		"description":  cfg.Description,
		"ExecStart":    cfg.ExecStart,
		"env file":     cfg.EnvFile,
	}
	for name, value := range singleLine {
		if strings.ContainsAny(value, unsafeUnitCharacters) {
			return fmt.Errorf("%s must be a single line", name)
		}
	}
	for _, line := range cfg.PreStart {
		if strings.ContainsAny(line, unsafeUnitCharacters) {
			return fmt.Errorf("pre-start command must be a single line")
		}
	}
	for key, value := range cfg.EnvVars {
		if !envKeyPattern.MatchString(key) {
			return fmt.Errorf("environment variable name %q is not a valid identifier", key)
		}
		if strings.ContainsAny(value, "\"\\"+unsafeUnitCharacters) {
			return fmt.Errorf("environment variable %s has a value that cannot be written safely into a unit file", key)
		}
	}
	return nil
}

func validConfigFileName(name string) bool {
	return configFilePattern.MatchString(name)
}
