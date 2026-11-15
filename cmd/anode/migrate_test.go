package main

import "testing"

func TestMigrationEngineForStoreKinds(t *testing.T) {
	cases := map[string]string{
		"postgres":    "postgres",
		"timescaledb": "postgres",
		"cockroachdb": "postgres",
		"mysql":       "mysql",
		"mariadb":     "mysql",
		"clickhouse":  "",
	}
	for kind, wantDialect := range cases {
		_, dialect, ok := migrationEngine(kind)
		if wantDialect == "" {
			if ok {
				t.Errorf("%s must not have a migration engine", kind)
			}
			continue
		}
		if !ok || dialect != wantDialect {
			t.Errorf("%s: dialect %q ok=%v, want %q", kind, dialect, ok, wantDialect)
		}
	}
}
