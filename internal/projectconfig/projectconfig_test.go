package projectconfig

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func testLock() *iag.LockFile {
	return &iag.LockFile{
		Resources: map[string]iag.Resource{
			"db-orders":  {Kind: iag.KindPostgres, AutoProvision: true},
			"cache-auth": {Kind: iag.KindRedis, AutoProvision: true},
		},
		Services: map[string]iag.Service{"orders": {Name: "orders"}},
	}
}

func defaults(kind string) string {
	return map[string]string{"postgres": "16", "redis": "7"}[kind]
}

func TestEnsureCreatesTemplateThatValidates(t *testing.T) {
	dir := t.TempDir()
	added, err := Ensure(dir, testLock(), defaults)
	if err != nil {
		t.Fatal(err)
	}
	if len(added) != 3 {
		t.Fatalf("added = %v, want 3 sections", added)
	}
	cfg, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := cfg.Validate(testLock()); err != nil {
		t.Fatalf("freshly written file must validate: %v", err)
	}
	if got := cfg.Stores["db-orders"]; got.Runtime != RuntimeDocker || got.Version != "16" {
		t.Errorf("postgres default = %+v, want docker runtime and version 16", got)
	}
	if got := cfg.Stores["cache-auth"]; got.Runtime != RuntimeBinary || got.Version != VersionAuto {
		t.Errorf("redis default = %+v, want binary runtime and version auto", got)
	}
}

func TestEnsureAppendsWithoutRewritingUserEdits(t *testing.T) {
	dir := t.TempDir()
	original := "# my comment\n[stores.\"db-orders\"]\nruntime = \"docker\"\nversion = \"15\"\n"
	if err := os.WriteFile(filepath.Join(dir, FileName), []byte(original), 0o644); err != nil {
		t.Fatal(err)
	}
	added, err := Ensure(dir, testLock(), defaults)
	if err != nil {
		t.Fatal(err)
	}
	if len(added) != 2 {
		t.Fatalf("added = %v, want the two missing sections only", added)
	}
	data, _ := os.ReadFile(filepath.Join(dir, FileName))
	if !strings.HasPrefix(string(data), original) {
		t.Fatalf("existing content must stay byte-for-byte:\n%s", data)
	}
	if strings.Count(string(data), `[stores."db-orders"]`) != 1 {
		t.Errorf("existing store section must not be duplicated:\n%s", data)
	}
	cfg, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Stores["db-orders"].Version != "15" {
		t.Errorf("user's version must be kept, got %q", cfg.Stores["db-orders"].Version)
	}
}

func TestValidateRejectsUnsafeOrIncompleteConfig(t *testing.T) {
	lock := testLock()
	valid := func() *File {
		return &File{
			Stores: map[string]Store{
				"db-orders":  {Runtime: RuntimeDocker, Version: "16"},
				"cache-auth": {Runtime: RuntimeBinary, Version: "7"},
			},
			Services: map[string]Service{"orders": {Runtime: RuntimeBinary}},
		}
	}
	cases := map[string]struct {
		mutate func(*File)
		want   string
	}{
		"missing store":   {func(f *File) { delete(f.Stores, "db-orders") }, "no [stores"},
		"empty version":   {func(f *File) { f.Stores["db-orders"] = Store{Runtime: RuntimeDocker} }, "version is empty"},
		"binary postgres": {func(f *File) { f.Stores["db-orders"] = Store{Runtime: RuntimeBinary, Version: "16"} }, "no binary install"},
		"unknown runtime": {func(f *File) { f.Stores["db-orders"] = Store{Runtime: "vm", Version: "16"} }, "must be"},
		"docker service":  {func(f *File) { f.Services["orders"] = Service{Runtime: RuntimeDocker} }, "app services run as systemd binaries"},
		"missing service": {func(f *File) { delete(f.Services, "orders") }, "no [services"},
	}
	for name, tc := range cases {
		t.Run(name, func(t *testing.T) {
			f := valid()
			tc.mutate(f)
			err := f.Validate(lock)
			if err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("Validate() = %v, want an error containing %q", err, tc.want)
			}
		})
	}
	if err := valid().Validate(lock); err != nil {
		t.Fatalf("valid config rejected: %v", err)
	}
}

func TestOmniMeshConfigValidates(t *testing.T) {
	dir := filepath.Join("..", "..", "examples", "marketplace")
	data, err := os.ReadFile(filepath.Join(dir, "anode.lock.json"))
	if err != nil {
		t.Fatal(err)
	}
	var lock iag.LockFile
	if err := json.Unmarshal(data, &lock); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(dir)
	if err != nil {
		t.Fatal(err)
	}
	if err := cfg.Validate(&lock); err != nil {
		t.Fatalf("the committed omni mesh config must validate: %v", err)
	}
}

func TestAutoVersionIsOnlyForBinaryStores(t *testing.T) {
	lock := testLock()
	ok := &File{
		Stores: map[string]Store{
			"db-orders":  {Runtime: RuntimeDocker, Version: "16"},
			"cache-auth": {Runtime: RuntimeBinary, Version: VersionAuto},
		},
		Services: map[string]Service{"orders": {Runtime: RuntimeBinary}},
	}
	if err := ok.Validate(lock); err != nil {
		t.Fatalf("auto is valid for a binary redis store: %v", err)
	}
	bad := &File{
		Stores: map[string]Store{
			"db-orders":  {Runtime: RuntimeDocker, Version: VersionAuto},
			"cache-auth": {Runtime: RuntimeBinary, Version: VersionAuto},
		},
		Services: map[string]Service{"orders": {Runtime: RuntimeBinary}},
	}
	if err := bad.Validate(lock); err == nil || !strings.Contains(err.Error(), "only for runtime") {
		t.Fatalf("auto must be rejected for a docker store, got %v", err)
	}
}

func TestLoadRefusesHostPortInTheConfig(t *testing.T) {
	dir := t.TempDir()
	body := "[stores.\"db-orders\"]\nruntime = \"docker\"\nhost_port = 31000\n"
	if err := os.WriteFile(filepath.Join(dir, FileName), []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
	_, err := Load(dir)
	if err == nil || !strings.Contains(err.Error(), "anode.state.json") {
		t.Fatalf("a host_port in anode.toml must be refused with a pointer to the state file, got %v", err)
	}
}
