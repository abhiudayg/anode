package migrations

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

type Scylla struct {
	Image    string
	Host     string
	Port     string
	Keyspace string
	User     string
	Password string
}

func (s Scylla) Apply(dir string) (int, error) {
	if err := iag.ValidateKeyspace(s.Keyspace); err != nil {
		return 0, err
	}
	if strings.ContainsAny(s.User+s.Password, "\r\n") {
		return 0, fmt.Errorf("scylla credentials must be single-line values")
	}
	absDir, err := filepath.Abs(dir)
	if err != nil {
		return 0, err
	}
	workDir, err := os.MkdirTemp("", "anode-cqlsh-")
	if err != nil {
		return 0, err
	}
	defer os.RemoveAll(workDir)
	cfgPath := filepath.Join(workDir, "cqlshrc")
	if err := os.WriteFile(cfgPath, []byte(s.cqlshrc()), 0o600); err != nil {
		return 0, err
	}

	run := func(args ...string) (string, error) {
		out, err := exec.Command("docker", dockerArgs(s.Image, cfgPath, absDir, s.Host, s.Port, s.Keyspace, args...)...).CombinedOutput()
		if err != nil {
			return "", fmt.Errorf("cqlsh: %w: %s", err, strings.TrimSpace(string(out)))
		}
		return string(out), nil
	}

	if _, err := run("-e", fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (name text PRIMARY KEY, applied_at timestamp);", trackingTable)); err != nil {
		return 0, err
	}
	listing, err := run("-e", fmt.Sprintf("SELECT name FROM %s;", trackingTable))
	if err != nil {
		return 0, err
	}
	applied := make(map[string]bool)
	for _, name := range parseCQLNames(listing) {
		applied[name] = true
	}
	files, err := migrationFiles(dir, ".cql")
	if err != nil {
		return 0, err
	}
	count := 0
	for _, path := range files {
		name := filepath.Base(path)
		if applied[name] {
			continue
		}
		if _, err := run("-f", "/migrations/"+name); err != nil {
			return count, fmt.Errorf("%s: %w", name, err)
		}
		if _, err := run("-e", fmt.Sprintf("INSERT INTO %s (name, applied_at) VALUES ('%s', toTimestamp(now()));", trackingTable, quoteLiteral(name))); err != nil {
			return count, fmt.Errorf("record %s: %w", name, err)
		}
		count++
	}
	return count, nil
}

func (s Scylla) cqlshrc() string {
	if s.User == "" {
		return ""
	}
	return fmt.Sprintf("[authentication]\nusername = %s\npassword = %s\n", s.User, s.Password)
}

func dockerArgs(image, cfgPath, migrationsDir, host, port, keyspace string, cqlshArgs ...string) []string {
	args := []string{
		"run", "--rm", "--network", "host",
		"-v", cfgPath + ":/root/.cassandra/cqlshrc:ro",
		"-v", migrationsDir + ":/migrations:ro",
		"--entrypoint", "cqlsh", image, host, port, "-k", keyspace,
	}
	return append(args, cqlshArgs...)
}

func parseCQLNames(output string) []string {
	var names []string
	afterRule := false
	for _, line := range strings.Split(output, "\n") {
		trimmed := strings.TrimSpace(line)
		switch {
		case strings.HasPrefix(trimmed, "---"):
			afterRule = true
		case strings.HasPrefix(trimmed, "("):
			afterRule = false
		case afterRule && trimmed != "":
			names = append(names, trimmed)
		}
	}
	return names
}
