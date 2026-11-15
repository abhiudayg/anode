package migrations

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const trackingTable = "anode_migrations"

func SplitStatements(script string) []string {
	var kept []string
	for _, line := range strings.Split(script, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "--") {
			continue
		}
		kept = append(kept, line)
	}
	var statements []string
	for _, stmt := range strings.Split(strings.Join(kept, "\n"), ";") {
		if s := strings.TrimSpace(stmt); s != "" {
			statements = append(statements, s)
		}
	}
	return statements
}

func migrationFiles(dir, ext string) ([]string, error) {
	files, err := filepath.Glob(filepath.Join(dir, "*"+ext))
	if err != nil {
		return nil, err
	}
	sort.Strings(files)
	return files, nil
}

func readMigration(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func quoteLiteral(s string) string {
	return strings.ReplaceAll(s, "'", "''")
}
