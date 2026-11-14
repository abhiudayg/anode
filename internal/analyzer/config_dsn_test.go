package analyzer

import (
	"path/filepath"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestDSNReadFromConfigFileRecordsConfigKey(t *testing.T) {
	dir, err := filepath.Abs("testdata/configdsn")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}

	var found *iag.Binding
	for _, svc := range lock.Services {
		for i := range svc.Bindings {
			if svc.Bindings[i].Protocol == string(iag.KindPostgres) {
				found = &svc.Bindings[i]
			}
		}
	}
	if found == nil {
		t.Fatalf("expected a postgres binding for the config-file DSN")
	}
	if found.ConfigKey != "database.dsn" {
		t.Errorf("ConfigKey = %q, want database.dsn", found.ConfigKey)
	}
	if found.InjectEnv != "" {
		t.Errorf("config-file DSN must not claim an env var, got %q", found.InjectEnv)
	}
}

func TestConfigFileReadFromProjectCodeIsRecorded(t *testing.T) {
	dir, err := filepath.Abs("testdata/configdsn")
	if err != nil {
		t.Fatal(err)
	}
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("LoadAndAnalyze failed: %v", err)
	}
	var files []string
	for _, svc := range lock.Services {
		files = append(files, svc.ConfigFile)
	}
	if !strings.Contains(strings.Join(files, ","), "config.json") {
		t.Errorf("expected config_file config.json, got %v", files)
	}
}
