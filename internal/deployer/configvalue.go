package deployer

import (
	"fmt"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

func configKeyEnv(configKey string) string {
	return strings.ToUpper(strings.NewReplacer(".", "_", "-", "_").Replace(configKey))
}

func configBindingValue(kind, configKey string, autoProvision bool, port int, secrets map[string]string) (string, error) {
	if kind == "redis" && autoProvision {
		return RedisConnectionURL(secrets[RedisPasswordKey()], port), nil
	}
	key := configKeyEnv(configKey)
	value := secrets[key]
	if value == "" {
		return "", fmt.Errorf("%s is missing from .env (the value for config key %s)", key, configKey)
	}
	return value, nil
}

func BindingEnvKey(serviceName string, b iag.Binding) string {
	if b.InjectEnv != "" {
		return b.InjectEnv
	}
	return envName(serviceName) + "_DB_URL"
}
