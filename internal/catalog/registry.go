package catalog

import (
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

//go:embed defaults.yaml
var defaultCatalogYAML []byte

type CatalogFile struct {
	Drivers map[string]*DriverSpec `yaml:"drivers"`
}

type Registry struct {
	drivers map[string]*DriverSpec
}

func NewRegistry() *Registry {
	r := &Registry{
		drivers: make(map[string]*DriverSpec),
	}
	r.loadEmbeddedDefaults()
	return r
}

func (r *Registry) loadEmbeddedDefaults() {
	var file CatalogFile
	if err := yaml.Unmarshal(defaultCatalogYAML, &file); err == nil {
		for k, v := range file.Drivers {
			if v.Kind == "" {
				v.Kind = k
			}
			r.drivers[k] = v
		}
	}
}

// LoadProjectOverrides inspects repo-level and user-level catalog paths and merges overrides.
func (r *Registry) LoadProjectOverrides(rootDir string) {
	// 1. User global directory: ~/.anode/catalog.yaml, ~/.anode/catalog/*.yaml
	if home, err := os.UserHomeDir(); err == nil {
		r.loadFromPath(filepath.Join(home, ".anode", "catalog.yaml"))
		r.loadFromDir(filepath.Join(home, ".anode", "catalog"))
	}

	// 2. Project local files: <rootDir>/anode.catalog.yaml, <rootDir>/.anode/catalog.yaml, <rootDir>/.anode/catalog/*.yaml
	r.loadFromPath(filepath.Join(rootDir, "anode.catalog.yaml"))
	r.loadFromPath(filepath.Join(rootDir, ".anode", "catalog.yaml"))
	r.loadFromDir(filepath.Join(rootDir, ".anode", "catalog"))
}

func (r *Registry) loadFromPath(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	var file CatalogFile
	if err := yaml.Unmarshal(data, &file); err == nil {
		for k, v := range file.Drivers {
			if v.Kind == "" {
				v.Kind = k
			}
			r.drivers[k] = v
		}
	}
}

func (r *Registry) loadFromDir(dir string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if ext == ".yaml" || ext == ".yml" {
			r.loadFromPath(filepath.Join(dir, entry.Name()))
		}
	}
}

// Resolve looks up a driver by kind, falling back to a safe generic least-privilege driver.
func (r *Registry) Resolve(kind string) *DriverSpec {
	normalized := strings.ToLower(strings.TrimSpace(kind))
	if spec, exists := r.drivers[normalized]; exists {
		return spec
	}

	// Dynamic fallback for any of 100+ arbitrary kinds not explicitly pre-defined:
	// Synthesizes a safe least-privilege driver automatically.
	return &DriverSpec{
		Kind:           normalized,
		Category:       "generic_stateful",
		DefaultVersion: "latest",
		Runtime: RuntimeSpec{
			ImageTemplate: fmt.Sprintf("%s:{{.Version}}", normalized),
			DataMount:     fmt.Sprintf("/var/lib/%s/data", normalized),
		},
		Security: SecuritySpec{
			UID:             999,
			GID:             999,
			FileMode:        "0700",
			NoNewPrivileges: true,
			OOMScoreAdjust:  -500,
			Cgroups: CgroupsLimit{
				MemoryMax: "1G",
				CPUQuota:  "100%",
			},
		},
		Networking: NetworkingSpec{
			PrimaryPort:   8080,
			BindInterface: "127.0.0.1",
			Protocol:      normalized,
		},
		ConnectionEnv: map[string]string{
			"URL":  fmt.Sprintf("%s://{{.Host}}:{{.Port}}", normalized),
			"HOST": "{{.Host}}",
			"PORT": "{{.Port}}",
		},
	}
}

// ListKinds returns sorted list of registered driver kinds.
func (r *Registry) ListKinds() []string {
	var kinds []string
	for k := range r.drivers {
		kinds = append(kinds, k)
	}
	sort.Strings(kinds)
	return kinds
}
