package analyzer

import (
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

func attachStoreMigrations(lock *iag.LockFile, rootDir string) {
	names := make([]string, 0, len(lock.Services))
	for name := range lock.Services {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		dir := filepath.Join("migrations", name)
		if !hasStoreMigrationFiles(filepath.Join(rootDir, dir)) {
			continue
		}
		for _, b := range lock.Services[name].Bindings {
			res, ok := lock.Resources[b.ResourceRef]
			if !ok || res.Migrations != nil || (res.Kind != "clickhouse" && res.Kind != "scylladb") {
				continue
			}
			tool := "sql"
			if res.Kind == "scylladb" {
				tool = "cql"
			}
			res.Migrations = &iag.MigrationSpec{Tool: tool, Path: dir, Execution: "pre_traffic_job"}
			lock.Resources[b.ResourceRef] = res
		}
	}
}

func hasStoreMigrationFiles(dir string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, entry := range entries {
		if n := entry.Name(); !entry.IsDir() && (strings.HasSuffix(n, ".sql") || strings.HasSuffix(n, ".cql")) {
			return true
		}
	}
	return false
}
