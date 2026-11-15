package projectconfig

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/BurntSushi/toml"

	"github.com/abhiudayg/anode/internal/iag"
)

const FileName = "anode.toml"

const (
	RuntimeBinary   = "binary"
	RuntimeDocker   = "docker"
	RuntimeExternal = "external"
)

// VersionAuto is for binary stores: the version is whatever the host's package provides, read at deploy time.
const VersionAuto = "auto"

type File struct {
	Stores   map[string]Store   `toml:"stores"`
	Services map[string]Service `toml:"services"`
}

type Store struct {
	Runtime  string `toml:"runtime"`
	Version  string `toml:"version"`
	Image    string `toml:"image,omitempty"`
	HostPort int    `toml:"host_port,omitempty"`
}

type Service struct {
	Runtime string `toml:"runtime"`
}

// HasNativeInstall reports whether Anode can install this store kind as a host binary.
func HasNativeInstall(kind string) bool {
	return kind == string(iag.KindRedis)
}

func Load(rootDir string) (*File, error) {
	path := filepath.Join(rootDir, FileName)
	if _, err := os.Stat(path); errors.Is(err, fs.ErrNotExist) {
		return nil, fmt.Errorf("%s not found: run anode inspect to create it", path)
	}
	var f File
	if _, err := toml.DecodeFile(path, &f); err != nil {
		return nil, fmt.Errorf("invalid %s: %w", path, err)
	}
	return &f, nil
}

// Validate checks every store and service in the lockfile against the file before anything touches a host.
func (f *File) Validate(lock *iag.LockFile) error {
	resIDs := make([]string, 0, len(lock.Resources))
	for id := range lock.Resources {
		resIDs = append(resIDs, id)
	}
	sort.Strings(resIDs)
	for _, id := range resIDs {
		res := lock.Resources[id]
		if !res.AutoProvision {
			continue
		}
		store, ok := f.Stores[id]
		if !ok {
			return fmt.Errorf("%s has no [stores.%q] section: run anode inspect", FileName, id)
		}
		if store.Runtime != RuntimeExternal && strings.TrimSpace(store.Version) == "" {
			return fmt.Errorf("stores.%q.version is empty in %s: set a version and redeploy", id, FileName)
		}
		switch store.Runtime {
		case RuntimeBinary:
			if !HasNativeInstall(string(res.Kind)) {
				return fmt.Errorf("stores.%q: %s has no binary install; set runtime = %q", id, res.Kind, RuntimeDocker)
			}
		case RuntimeExternal:
		case RuntimeDocker:
			if store.Version == VersionAuto {
				return fmt.Errorf("stores.%q: version = %q is only for runtime = %q; set an explicit version for docker", id, VersionAuto, RuntimeBinary)
			}
		default:
			return fmt.Errorf("stores.%q.runtime must be %q or %q, got %q", id, RuntimeBinary, RuntimeDocker, store.Runtime)
		}
	}

	svcNames := make([]string, 0, len(lock.Services))
	for name := range lock.Services {
		svcNames = append(svcNames, name)
	}
	sort.Strings(svcNames)
	for _, name := range svcNames {
		svc, ok := f.Services[name]
		if !ok {
			return fmt.Errorf("%s has no [services.%q] section: run anode inspect", FileName, name)
		}
		if svc.Runtime != RuntimeBinary {
			return fmt.Errorf("services.%q.runtime must be %q: app services run as systemd binaries, Docker is not supported for app services yet", name, RuntimeBinary)
		}
	}
	return nil
}

// Ensure writes anode.toml with the defaults for every store and service in the lockfile.
// A new file gets the full template. An existing file is only appended to, so the user's edits and comments stay as written.
func Ensure(rootDir string, lock *iag.LockFile, defaultVersion func(kind string) string) ([]string, error) {
	path := filepath.Join(rootDir, FileName)
	existing := ""
	var known File
	if data, err := os.ReadFile(path); err == nil {
		existing = string(data)
		if _, err := toml.Decode(existing, &known); err != nil {
			return nil, fmt.Errorf("invalid %s: %w", path, err)
		}
	} else if !errors.Is(err, fs.ErrNotExist) {
		return nil, err
	}

	var added []string
	var b strings.Builder
	if existing == "" {
		b.WriteString("# Anode project configuration.\n")
		b.WriteString("# Versions and runtimes are written by `anode inspect`. Edit them here, then redeploy.\n")
		b.WriteString("# runtime = \"binary\" installs a host binary; \"docker\" runs the store in a container.\n")
	}

	resIDs := make([]string, 0, len(lock.Resources))
	for id := range lock.Resources {
		resIDs = append(resIDs, id)
	}
	sort.Strings(resIDs)
	for _, id := range resIDs {
		res := lock.Resources[id]
		if !res.AutoProvision {
			continue
		}
		if _, ok := known.Stores[id]; ok {
			continue
		}
		runtime := RuntimeDocker
		version := defaultVersion(string(res.Kind))
		if HasNativeInstall(string(res.Kind)) {
			runtime = RuntimeBinary
			version = VersionAuto
		}
		fmt.Fprintf(&b, "\n[stores.%s]\n", strconv.Quote(id))
		fmt.Fprintf(&b, "runtime = %s\n", strconv.Quote(runtime))
		fmt.Fprintf(&b, "version = %s\n", strconv.Quote(version))
		added = append(added, "stores."+id)
	}

	svcNames := make([]string, 0, len(lock.Services))
	for name := range lock.Services {
		svcNames = append(svcNames, name)
	}
	sort.Strings(svcNames)
	for _, name := range svcNames {
		if _, ok := known.Services[name]; ok {
			continue
		}
		fmt.Fprintf(&b, "\n[services.%s]\n", strconv.Quote(name))
		fmt.Fprintf(&b, "runtime = %s\n", strconv.Quote(RuntimeBinary))
		added = append(added, "services."+name)
	}

	if len(added) == 0 {
		return nil, nil
	}
	content := existing
	if existing != "" && !strings.HasSuffix(existing, "\n") {
		content += "\n"
	}
	if err := os.WriteFile(path, []byte(content+b.String()), 0o644); err != nil {
		return nil, err
	}
	return added, nil
}

func (f *File) Managed(id string, res iag.Resource) bool {
	return res.AutoProvision && f.Stores[id].Runtime != RuntimeExternal
}
