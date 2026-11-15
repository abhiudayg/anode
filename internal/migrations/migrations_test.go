package migrations

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"sync"
	"testing"
)

func TestSplitStatementsDropsCommentsAndEmptyParts(t *testing.T) {
	script := "-- analytics events\nCREATE TABLE a (x String);\n\n-- next\nCREATE TABLE b (y String)\n;\n"
	want := []string{"CREATE TABLE a (x String)", "CREATE TABLE b (y String)"}
	if got := SplitStatements(script); !reflect.DeepEqual(got, want) {
		t.Fatalf("got %q, want %q", got, want)
	}
}

type fakeClickHouse struct {
	mu        sync.Mutex
	database  string
	user, pw  string
	applied   []string
	statement []string
}

func (f *fakeClickHouse) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	f.mu.Lock()
	defer f.mu.Unlock()
	user, pw, ok := r.BasicAuth()
	if !ok || user != f.user || pw != f.pw {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	f.database = r.URL.Query().Get("database")
	body, _ := io.ReadAll(r.Body)
	sql := string(body)
	f.statement = append(f.statement, sql)
	switch {
	case strings.HasPrefix(sql, "SELECT name FROM anode_migrations"):
		fmt.Fprint(w, strings.Join(f.applied, "\n"))
	case strings.HasPrefix(sql, "INSERT INTO anode_migrations"):
		start := strings.Index(sql, "VALUES ('") + len("VALUES ('")
		f.applied = append(f.applied, strings.TrimSuffix(sql[start:], "')"))
	}
}

func writeMigrations(t *testing.T, dir string, files map[string]string) {
	t.Helper()
	for name, body := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func TestClickHouseAppliesEachFileOnceAndTracksIt(t *testing.T) {
	fake := &fakeClickHouse{user: "default", pw: "placeholder-not-real"}
	server := httptest.NewServer(fake)
	defer server.Close()
	dir := t.TempDir()
	writeMigrations(t, dir, map[string]string{
		"001_create_events.sql": "-- events\nCREATE TABLE IF NOT EXISTS events (name String) ENGINE = MergeTree ORDER BY name;",
		"002_add_user.sql":      "ALTER TABLE events ADD COLUMN user_id String;",
	})
	runner := ClickHouse{Endpoint: server.URL, Database: "analytics-clickhouse", User: "default", Password: "placeholder-not-real"}

	applied, err := runner.Apply(dir)
	if err != nil || applied != 2 {
		t.Fatalf("first run: applied %d, err %v; want 2", applied, err)
	}
	if fake.database != "analytics-clickhouse" {
		t.Fatalf("statements must target the configured database, got %q", fake.database)
	}
	if strings.Contains(strings.Join(fake.statement, "\n"), "-- events") {
		t.Fatalf("comments must not be sent to ClickHouse")
	}
	again, err := runner.Apply(dir)
	if err != nil || again != 0 {
		t.Fatalf("second run must apply nothing, applied %d, err %v", again, err)
	}
}

func TestClickHouseRejectsWrongPassword(t *testing.T) {
	server := httptest.NewServer(&fakeClickHouse{user: "default", pw: "right"})
	defer server.Close()
	dir := t.TempDir()
	writeMigrations(t, dir, map[string]string{"001.sql": "SELECT 1"})
	_, err := ClickHouse{Endpoint: server.URL, Database: "d", User: "default", Password: "wrong"}.Apply(dir)
	if err == nil {
		t.Fatalf("a rejected login must fail the migration")
	}
}

func TestParseCQLNamesReadsTheRowsOfACqlshTable(t *testing.T) {
	output := " name\n-----------------\n 001_create_checks.cql\n 002_add_region.cql\n\n(2 rows)\n"
	want := []string{"001_create_checks.cql", "002_add_region.cql"}
	if got := parseCQLNames(output); !reflect.DeepEqual(got, want) {
		t.Fatalf("got %q, want %q", got, want)
	}
	if got := parseCQLNames(" name\n------\n\n(0 rows)\n"); len(got) != 0 {
		t.Fatalf("an empty table has no names, got %q", got)
	}
}

func TestScyllaCredentialsStayOutOfTheCommandLine(t *testing.T) {
	s := Scylla{Image: "scylladb/scylla:5.4", Host: "127.0.0.1", Port: "9042", Keyspace: "fraud", User: "anode", Password: "placeholder-not-real"}
	args := dockerArgs(s.Image, "/tmp/cfg/cqlshrc", "/abs/migrations", s.Host, s.Port, s.Keyspace, "-f", "/migrations/001.cql")
	joined := strings.Join(args, " ")
	if strings.Contains(joined, s.Password) || strings.Contains(joined, s.User) {
		t.Fatalf("credentials must not appear in the docker command: %s", joined)
	}
	for _, want := range []string{"--entrypoint cqlsh", "/root/.cassandra/cqlshrc:ro", "-k fraud"} {
		if !strings.Contains(joined, want) {
			t.Fatalf("docker command must contain %q: %s", want, joined)
		}
	}
	if !strings.Contains(s.cqlshrc(), "password = placeholder-not-real") {
		t.Fatalf("the login must be written to the cqlshrc file")
	}
	if (Scylla{}).cqlshrc() != "" {
		t.Fatalf("no user means no authentication section")
	}
}
