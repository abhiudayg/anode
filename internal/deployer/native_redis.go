package deployer

import (
	"fmt"
	"net/url"
	"strings"
)

const redisStartScript = `#!/bin/sh
set -eu
printf 'bind 127.0.0.1\nport %s\ndir /var/lib/%s\nappendonly yes\nrequirepass %s\n' "$1" "$2" "$REDIS_PASSWORD" | exec /usr/bin/redis-server -
`

const redisStartPath = "/usr/local/lib/anode/redis-start"

func RedisPasswordKey() string {
	return "REDIS_PASSWORD"
}

func redisEnvPath(resID string) string {
	return "/etc/anode/" + resID + ".env"
}

func validateRedisPassword(password string) error {
	if password == "" {
		return fmt.Errorf("redis password is empty")
	}
	if strings.ContainsAny(password, "\r\n\x00") {
		return fmt.Errorf("redis password must not contain line breaks or NUL characters")
	}
	return nil
}

func RedisConnectionURL(password string, port int) string {
	u := url.URL{
		Scheme: "redis",
		User:   url.UserPassword("", password),
		Host:   fmt.Sprintf("127.0.0.1:%d", port),
	}
	return u.String()
}

func redisUnit(resID string, port int) (string, error) {
	return GenerateSystemdUnit(SystemdUnitConfig{
		ServiceName: resID,
		Description: fmt.Sprintf("Anode native Redis %s", resID),
		ExecStart:   fmt.Sprintf("%s %d %s", redisStartPath, port, resID),
		StateDir:    resID,
		EnvFile:     redisEnvPath(resID),
	})
}

func (b *Bootstrapper) provisionNativeRedis(resID string, port int, password, version string) error {
	if err := validateRedisPassword(password); err != nil {
		return err
	}
	unit, err := redisUnit(resID, port)
	if err != nil {
		return err
	}
	unitPath := "/etc/systemd/system/anode-" + resID + ".service"
	envPath := redisEnvPath(resID)

	steps := []string{
		"command -v redis-server >/dev/null 2>&1 || (DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq redis-server)",
		"systemctl disable --now redis-server >/dev/null 2>&1 || true",
		"mkdir -p /etc/anode && chmod 700 /etc/anode && mkdir -p /usr/local/lib/anode",
	}
	for _, cmd := range steps {
		if _, err := b.ssh.Run(cmd); err != nil {
			return fmt.Errorf("redis host setup for %s failed: %w", resID, err)
		}
	}
	installed, err := b.ssh.Run("redis-server --version")
	if err != nil {
		return fmt.Errorf("could not read the redis version on the host: %w", err)
	}
	if err := checkRedisVersion(installed, version); err != nil {
		return fmt.Errorf("stores.%q: %w", resID, err)
	}

	if err := b.WriteRemoteFile(redisStartScript, redisStartPath); err != nil {
		return err
	}
	if err := b.WriteRemoteFile(fmt.Sprintf("REDIS_PASSWORD=%s\n", password), envPath); err != nil {
		return err
	}
	if err := b.WriteRemoteFile(unit, unitPath); err != nil {
		return err
	}
	if _, err := b.ssh.Run(fmt.Sprintf("chmod 755 '%s' && chmod 600 '%s' && chmod 644 '%s'", redisStartPath, envPath, unitPath)); err != nil {
		return fmt.Errorf("failed to set redis file modes for %s: %w", resID, err)
	}

	start := fmt.Sprintf("systemctl daemon-reload && systemctl restart 'anode-%s.service' && sleep 2 && systemctl is-active --quiet 'anode-%s.service'", resID, resID)
	if _, err := b.ssh.Run(start); err != nil {
		return fmt.Errorf("native redis %s did not start (check: journalctl -u anode-%s.service): %w", resID, resID, err)
	}

	ping := fmt.Sprintf(`sh -c '. %s && REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h 127.0.0.1 -p %d ping | grep -q PONG'`, envPath, port)
	if _, err := b.ssh.Run(ping); err != nil {
		return fmt.Errorf("native redis %s did not answer an authenticated ping: %w", resID, err)
	}
	return nil
}
