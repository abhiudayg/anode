package deployer

import "testing"

func TestConfigKeyEnvNamesDotsAsUnderscores(t *testing.T) {
	cases := map[string]string{
		"database.dsn":     "DATABASE_DSN",
		"redis-url":        "REDIS_URL",
		"storage.main.dsn": "STORAGE_MAIN_DSN",
	}
	for key, want := range cases {
		if got := configKeyEnv(key); got != want {
			t.Errorf("configKeyEnv(%s) = %q, want %q", key, got, want)
		}
	}
}

func TestConfigBindingValueReadsKeyFromDotEnvValues(t *testing.T) {
	value, err := configBindingValue("postgres", "database.dsn", false, 5432, map[string]string{"DATABASE_DSN": "postgres://x"})
	if err != nil || value != "postgres://x" {
		t.Fatalf("configBindingValue = %q, %v", value, err)
	}
	if _, err := configBindingValue("postgres", "database.dsn", false, 5432, map[string]string{}); err == nil {
		t.Errorf("expected an error when the key is missing from .env")
	}
}
