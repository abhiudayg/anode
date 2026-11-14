package deployer

import (
	"os"
	"path/filepath"
	"testing"
)

func TestReadDotEnvParsesKeysQuotesAndComments(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".env")
	content := "# comment\n\nREDIS_FILEBROWSER_EXAMPLE_PASSWORD=\"s3cret=value\"\nPLAIN = plain\nSINGLE='quoted'\nnot a pair\n"
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
	values, err := ReadDotEnv(path)
	if err != nil {
		t.Fatalf("ReadDotEnv failed: %v", err)
	}
	cases := map[string]string{
		"REDIS_FILEBROWSER_EXAMPLE_PASSWORD": "s3cret=value",
		"PLAIN":                              "plain",
		"SINGLE":                             "quoted",
	}
	for key, want := range cases {
		if got := values[key]; got != want {
			t.Errorf("%s = %q, want %q", key, got, want)
		}
	}
	if _, ok := values["not a pair"]; ok {
		t.Errorf("malformed line must not become a key")
	}
}

func TestReadDotEnvMissingFileIsEmpty(t *testing.T) {
	values, err := ReadDotEnv(filepath.Join(t.TempDir(), "absent.env"))
	if err != nil {
		t.Fatalf("missing .env must not be an error: %v", err)
	}
	if len(values) != 0 {
		t.Errorf("expected no values, got %v", values)
	}
}
