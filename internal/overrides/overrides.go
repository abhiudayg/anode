package overrides

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/abhiudayg/anode/internal/iag"
)

const FileName = "anode.overrides.json"

type Override struct {
	Path     string          `json:"path"`
	Anchor   string          `json:"anchor,omitempty"`
	Value    json.RawMessage `json:"value"`
	Inferred json.RawMessage `json:"inferred"`
	Note     string          `json:"note,omitempty"`
}

type File struct {
	Overrides []Override `json:"overrides"`
}

func ApplyFile(rootDir string, lock *iag.LockFile) error {
	data, err := os.ReadFile(filepath.Join(rootDir, FileName))
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	var f File
	if err := json.Unmarshal(data, &f); err != nil {
		return fmt.Errorf("invalid %s: %w", FileName, err)
	}
	if reanchor(lock, &f) {
		out, err := json.MarshalIndent(f, "", "  ")
		if err != nil {
			return err
		}
		if err := os.WriteFile(filepath.Join(rootDir, FileName), append(out, '\n'), 0o644); err != nil {
			return err
		}
	}
	return Apply(lock, f)
}

// reanchor moves an override to a resource that was renamed, when exactly one resource in the lockfile has the same
// source file as the override's anchor. It reports whether any override changed.
func reanchor(lock *iag.LockFile, f *File) bool {
	changed := false
	for i, o := range f.Overrides {
		kind, id, field, err := parse(o.Path)
		if err != nil || kind != "resources" || o.Anchor == "" {
			continue
		}
		if _, ok := lock.Resources[id]; ok {
			continue
		}
		var matches []string
		for newID, res := range lock.Resources {
			if strings.SplitN(res.Provenance, ":", 2)[0] == o.Anchor {
				matches = append(matches, newID)
			}
		}
		if len(matches) != 1 {
			continue
		}
		f.Overrides[i].Path = "resources." + matches[0] + "." + field
		changed = true
	}
	return changed
}

func Apply(lock *iag.LockFile, f File) error {
	var conflicts []string
	for _, o := range f.Overrides {
		current, err := read(lock, o.Path)
		if err != nil {
			return fmt.Errorf("%s: %w", o.Path, err)
		}
		if !sameJSON(current, o.Inferred) {
			conflicts = append(conflicts, fmt.Sprintf("%s: the code now infers %s; the override was made against %s. Edit %s to accept the new value or keep yours",
				o.Path, current, o.Inferred, FileName))
			continue
		}
		if err := write(lock, o.Path, o.Value); err != nil {
			return fmt.Errorf("%s: %w", o.Path, err)
		}
	}
	if len(conflicts) > 0 {
		return fmt.Errorf("%d override conflict(s); nothing was written:\n  %s", len(conflicts), strings.Join(conflicts, "\n  "))
	}
	return nil
}

func sameJSON(a, b json.RawMessage) bool {
	var x, y bytes.Buffer
	if json.Compact(&x, a) != nil || json.Compact(&y, b) != nil {
		return false
	}
	return x.String() == y.String()
}

func parse(path string) (kind, id, field string, err error) {
	parts := strings.SplitN(path, ".", 3)
	if len(parts) != 3 || (parts[0] != "resources" && parts[0] != "services") {
		return "", "", "", fmt.Errorf("unsupported path (want resources.<id>.<field> or services.<name>.<field>)")
	}
	return parts[0], parts[1], parts[2], nil
}

func read(lock *iag.LockFile, path string) (json.RawMessage, error) {
	kind, id, field, err := parse(path)
	if err != nil {
		return nil, err
	}
	if kind == "resources" {
		res, ok := lock.Resources[id]
		if !ok {
			return nil, fmt.Errorf("no such resource")
		}
		switch field {
		case "topics":
			return json.Marshal(res.Topics)
		case "buckets":
			return json.Marshal(res.Buckets)
		case "kind":
			return json.Marshal(res.Kind)
		case "collections":
			return json.Marshal(res.Collections)
		}
	} else {
		svc, ok := lock.Services[id]
		if !ok {
			return nil, fmt.Errorf("no such service")
		}
		if field == "config_env" {
			return json.Marshal(svc.ConfigEnv)
		}
	}
	return nil, fmt.Errorf("field %q cannot be overridden", field)
}

func write(lock *iag.LockFile, path string, value json.RawMessage) error {
	kind, id, field, err := parse(path)
	if err != nil {
		return err
	}
	if kind == "resources" {
		res := lock.Resources[id]
		switch field {
		case "topics":
			if err := json.Unmarshal(value, &res.Topics); err != nil {
				return err
			}
		case "buckets":
			if err := json.Unmarshal(value, &res.Buckets); err != nil {
				return err
			}
		case "collections":
			if err := json.Unmarshal(value, &res.Collections); err != nil {
				return err
			}
		case "kind":
			var k iag.ResourceKind
			if err := json.Unmarshal(value, &k); err != nil {
				return err
			}
			res.Kind = k
		default:
			return fmt.Errorf("field %q cannot be overridden", field)
		}
		lock.Resources[id] = res
		return nil
	}
	svc := lock.Services[id]
	if field != "config_env" {
		return fmt.Errorf("field %q cannot be overridden", field)
	}
	if err := json.Unmarshal(value, &svc.ConfigEnv); err != nil {
		return err
	}
	lock.Services[id] = svc
	return nil
}
