package analyzer

import (
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func TestEngineFromEnvNameRefinesPostgresDriver(t *testing.T) {
	cases := []struct {
		kind iag.ResourceKind
		env  string
		want iag.ResourceKind
	}{
		{iag.KindPostgres, "ACCOUNTING_TIMESCALE_DSN", "timescaledb"},
		{iag.KindPostgres, "SUBSCRIPTIONS_COCKROACH_DSN", "cockroachdb"},
		{iag.KindPostgres, "ORDERS_DB_URL", iag.KindPostgres},
		{"mysql", "ACCOUNTING_TIMESCALE_DSN", "mysql"},
	}
	for _, c := range cases {
		if got := engineFromEnvName(c.kind, c.env); got != c.want {
			t.Errorf("engineFromEnvName(%s, %s) = %s, want %s", c.kind, c.env, got, c.want)
		}
	}
}
