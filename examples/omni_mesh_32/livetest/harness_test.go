//go:build live

package livetest

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// The addresses match infra/compose.yaml. Run the tests through infra/live-test.sh, which starts the stores.
const (
	pgDSN         = "postgres://postgres:postgres@127.0.0.1:15432/mesh?sslmode=disable"
	redisAddr     = "127.0.0.1:16379"
	valkeyAddr    = "127.0.0.1:16380"
	mariaDSN      = "root:mesh@tcp(127.0.0.1:13306)/mesh"
	mongoURI      = "mongodb://127.0.0.1:27018"
	rabbitURL     = "amqp://guest:guest@127.0.0.1:5673/"
	clickAddr     = "127.0.0.1:9001"
	clickDB       = "mesh"
	clickUser     = "mesh"
	clickPassword = "mesh"
	memcachedAddr = "127.0.0.1:11212"
	qdrantURL     = "http://127.0.0.1:16333"
)

// migrationsDir returns the mesh's migrations folder.
func migrationsDir(t *testing.T) string {
	t.Helper()
	return filepath.Join("..", "migrations")
}

// buildService compiles services/<name> once per test binary run and returns the path of the binary.
func buildService(t *testing.T, name string) string {
	t.Helper()
	bin := filepath.Join(t.TempDir(), name)
	cmd := exec.Command("go", "build", "-o", bin, "../services/"+name)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("build %s: %v\n%s", name, err, out)
	}
	return bin
}

// startService runs a built service with env, waits for its /healthz, and stops it when the test ends. It returns the
// base URL.
func startService(t *testing.T, name string, env map[string]string) string {
	t.Helper()
	bin := buildService(t, name)
	port := freePort(t)
	cmd := exec.Command(bin)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PORT=%d", port))
	for k, v := range env {
		cmd.Env = append(cmd.Env, k+"="+v)
	}
	var logs bytes.Buffer
	cmd.Stdout = &logs
	cmd.Stderr = &logs
	if err := cmd.Start(); err != nil {
		t.Fatalf("start %s: %v", name, err)
	}
	t.Cleanup(func() {
		_ = cmd.Process.Kill()
		_, _ = cmd.Process.Wait()
		if t.Failed() {
			t.Logf("%s logs:\n%s", name, logs.String())
		}
	})
	base := fmt.Sprintf("http://127.0.0.1:%d", port)
	deadline := time.Now().Add(20 * time.Second)
	for time.Now().Before(deadline) {
		resp, err := http.Get(base + "/healthz")
		if err == nil {
			_ = resp.Body.Close()
			if resp.StatusCode < 400 {
				return base
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatalf("%s did not pass /healthz within 20s\n%s", name, logs.String())
	return ""
}

func freePort(t *testing.T) int {
	t.Helper()
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port
}

// postJSON sends body as JSON and returns the status and the response body.
func postJSON(t *testing.T, method, url string, body any) (int, []byte) {
	t.Helper()
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		reader = bytes.NewReader(payload)
	}
	req, err := http.NewRequestWithContext(context.Background(), method, url, reader)
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("%s %s: %v", method, url, err)
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, out
}

func requireStatus(t *testing.T, got int, want int, body []byte) {
	t.Helper()
	if got != want {
		t.Fatalf("status = %d, want %d: %s", got, want, body)
	}
}

// uniq returns a suffix that keeps records from different test runs apart.
func uniq() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func openPostgres(t *testing.T) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), pgDSN)
	if err != nil {
		t.Fatalf("postgres: %v", err)
	}
	t.Cleanup(pool.Close)
	eventually(t, "postgres", func() error { return pool.Ping(context.Background()) })
	return pool
}

// migratePostgres applies the migrations of the services that use the mesh Postgres database.
func migratePostgres(t *testing.T) {
	t.Helper()
	pool := openPostgres(t)
	for _, svc := range []string{"users", "orders", "cms", "coupons", "loyalty"} {
		applySQLFiles(t, filepath.Join(migrationsDir(t), svc), func(stmt string) error {
			_, err := pool.Exec(context.Background(), stmt)
			return err
		})
	}
}

func migrateMaria(t *testing.T) {
	t.Helper()
	db, err := sql.Open("mysql", mariaDSN)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	eventually(t, "mariadb", db.Ping)
	applySQLFiles(t, filepath.Join(migrationsDir(t), "inventory"), func(stmt string) error {
		_, err := db.Exec(stmt)
		return err
	})
}

func migrateClickhouse(t *testing.T) {
	t.Helper()
	conn := openClickhouse(t)
	for _, svc := range []string{"analytics", "auditlog", "metrics"} {
		applySQLFiles(t, filepath.Join(migrationsDir(t), svc), func(stmt string) error {
			return conn.Exec(context.Background(), stmt)
		})
	}
}

func openClickhouse(t *testing.T) clickhouse.Conn {
	t.Helper()
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: []string{clickAddr},
		Auth: clickhouse.Auth{Database: clickDB, Username: clickUser, Password: clickPassword},
	})
	if err != nil {
		t.Fatalf("clickhouse: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	eventually(t, "clickhouse", func() error { return conn.Ping(context.Background()) })
	return conn
}

// applySQLFiles runs every statement of every .sql file in dir. Comment lines are dropped.
func applySQLFiles(t *testing.T, dir string, exec func(stmt string) error) {
	t.Helper()
	files, err := filepath.Glob(filepath.Join(dir, "*.sql"))
	if err != nil {
		t.Fatal(err)
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		var lines []string
		for _, line := range strings.Split(string(data), "\n") {
			if !strings.HasPrefix(strings.TrimSpace(line), "--") {
				lines = append(lines, line)
			}
		}
		for _, stmt := range strings.Split(strings.Join(lines, "\n"), ";") {
			if strings.TrimSpace(stmt) == "" {
				continue
			}
			if err := exec(stmt); err != nil {
				t.Fatalf("apply %s: %v\n%s", file, err, stmt)
			}
		}
	}
}

func openRedis(t *testing.T) *redis.Client {
	t.Helper()
	client := redis.NewClient(&redis.Options{Addr: redisAddr})
	t.Cleanup(func() { _ = client.Close() })
	return client
}

func openMaria(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("mysql", mariaDSN)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

// eventually retries fn until it succeeds or the store has had 90 seconds to start. Port checks alone are not enough:
// Docker accepts TCP connections before the server behind the port is ready.
func eventually(t *testing.T, what string, fn func() error) {
	t.Helper()
	deadline := time.Now().Add(90 * time.Second)
	var err error
	for {
		if err = fn(); err == nil {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("%s is not ready: %v", what, err)
		}
		time.Sleep(time.Second)
	}
}
