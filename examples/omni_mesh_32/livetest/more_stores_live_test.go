//go:build live

package livetest

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gocql/gocql"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const (
	s3Endpoint    = "127.0.0.1:9100"
	s3Key         = "mesh"
	s3Secret      = "meshsecret"
	timescaleDSN  = "postgres://postgres:postgres@127.0.0.1:15433/mesh?sslmode=disable"
	cockroachBase = "postgres://root@127.0.0.1:26258/%s?sslmode=disable"
	scyllaHost    = "127.0.0.1"
	scyllaPort    = 9042
	scyllaSpace   = "mesh"
)

func s3Client(t *testing.T) *minio.Client {
	t.Helper()
	client, err := minio.New(s3Endpoint, &minio.Options{Creds: credentials.NewStaticV4(s3Key, s3Secret, ""), Secure: false})
	if err != nil {
		t.Fatalf("s3: %v", err)
	}
	return client
}

// ensureBuckets creates the buckets the services write to, if they are missing.
func ensureBuckets(t *testing.T, names ...string) {
	t.Helper()
	client := s3Client(t)
	for _, name := range names {
		eventually(t, "s3 bucket "+name, func() error {
			exists, err := client.BucketExists(context.Background(), name)
			if err != nil {
				return err
			}
			if exists {
				return nil
			}
			return client.MakeBucket(context.Background(), name, minio.MakeBucketOptions{})
		})
	}
}

func TestMediaCmsAndDocumentsAgainstS3AndMongoDB(t *testing.T) {
	ensureBuckets(t, "media", "cms-assets", "documents")
	migratePostgres(t)

	s3Env := func(prefix string) map[string]string {
		return map[string]string{
			prefix + "_MINIO_ENDPOINT":   s3Endpoint,
			prefix + "_MINIO_ACCESS_KEY": s3Key,
			prefix + "_MINIO_SECRET_KEY": s3Secret,
		}
	}

	media := startService(t, "media", s3Env("MEDIA"))
	name := "clip-" + uniq() + ".txt"
	payload := []byte("live media bytes " + uniq())
	status, body := putBytes(t, media+"/v1/media/"+name, "text/plain", payload)
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, media+"/v1/media/"+name, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !bytes.Equal(body, payload) {
		t.Fatalf("media bytes = %q, want %q", body, payload)
	}

	cms := startService(t, "cms", mergeEnv(s3Env("CMS"), map[string]string{"CMS_POSTGRES_DSN": pgDSN}))
	slug := "page-" + uniq()
	status, body = postJSON(t, http.MethodPost, cms+"/v1/pages", map[string]string{"slug": slug, "title": "Live", "body": "text"})
	requireStatus(t, status, http.StatusOK, body)
	status, body = postJSON(t, http.MethodGet, cms+"/v1/pages/"+slug, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), slug) {
		t.Fatalf("cms page = %s", body)
	}
	status, body = putBytes(t, cms+"/v1/assets/"+slug+".txt", "text/plain", []byte("asset"))
	requireStatus(t, status, http.StatusCreated, body)

	documents := startService(t, "documents", mergeEnv(s3Env("DOCUMENTS"), map[string]string{"DOCUMENTS_MONGO_URI": mongoURI}))
	docID := "doc-" + uniq()
	status, body = putBytes(t, documents+"/v1/documents/"+docID+"?title=Invoice", "application/pdf", []byte("%PDF-1.4 live"))
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, documents+"/v1/documents/"+docID, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), "Invoice") {
		t.Fatalf("document metadata = %s", body)
	}
}

func TestAccountingLedgerAgainstTimescaleDB(t *testing.T) {
	pool, err := pgxpool.New(context.Background(), timescaleDSN)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	eventually(t, "timescaledb", func() error { return pool.Ping(context.Background()) })
	applySQLFiles(t, filepath.Join(migrationsDir(t), "accounting"), func(stmt string) error {
		_, err := pool.Exec(context.Background(), stmt)
		return err
	})

	accounting := startService(t, "accounting", map[string]string{"ACCOUNTING_TIMESCALE_DSN": timescaleDSN})
	account := "acct-" + uniq()
	status, body := postJSON(t, http.MethodPost, accounting+"/v1/ledger/entries",
		map[string]any{"account": account, "amount_cents": 2500, "memo": "live"})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, accounting+"/v1/ledger/balance/"+account, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"balance_cents":2500`) {
		t.Fatalf("balance = %s, want 2500", body)
	}
}

func TestSubscriptionsAgainstCockroachDB(t *testing.T) {
	admin, err := sql.Open("pgx", fmt.Sprintf(cockroachBase, "defaultdb"))
	if err != nil {
		t.Fatal(err)
	}
	defer admin.Close()
	eventually(t, "cockroachdb", admin.Ping)
	if _, err := admin.Exec("CREATE DATABASE IF NOT EXISTS mesh"); err != nil {
		t.Fatalf("create database: %v", err)
	}
	dsn := fmt.Sprintf(cockroachBase, "mesh")
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	applySQLFiles(t, filepath.Join(migrationsDir(t), "subscriptions"), func(stmt string) error {
		_, err := db.Exec(stmt)
		return err
	})

	subscriptions := startService(t, "subscriptions", map[string]string{"SUBSCRIPTIONS_COCKROACH_DSN": dsn})
	id := "sub-" + uniq()
	status, body := postJSON(t, http.MethodPost, subscriptions+"/v1/subscriptions",
		map[string]string{"id": id, "customer_id": "c-1", "plan": "pro"})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, subscriptions+"/v1/subscriptions/"+id, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"plan":"pro"`) {
		t.Fatalf("subscription = %s", body)
	}
}

func TestFraudChecksAgainstScyllaDB(t *testing.T) {
	admin := gocql.NewCluster(scyllaHost)
	admin.Port = scyllaPort
	admin.Timeout = 10 * time.Second
	var session *gocql.Session
	eventually(t, "scylladb", func() error {
		s, err := admin.CreateSession()
		if err != nil {
			return err
		}
		session = s
		return nil
	})
	defer session.Close()
	if err := session.Query(fmt.Sprintf(
		"CREATE KEYSPACE IF NOT EXISTS %s WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}", scyllaSpace)).Exec(); err != nil {
		t.Fatalf("create keyspace: %v", err)
	}
	ks := gocql.NewCluster(scyllaHost)
	ks.Port = scyllaPort
	ks.Keyspace = scyllaSpace
	keyed, err := ks.CreateSession()
	if err != nil {
		t.Fatal(err)
	}
	defer keyed.Close()
	applyCQLFiles(t, filepath.Join(migrationsDir(t), "fraud"), keyed)

	fraud := startService(t, "fraud", map[string]string{
		"FRAUD_SCYLLA_HOSTS":    scyllaHost,
		"FRAUD_SCYLLA_KEYSPACE": scyllaSpace,
	})
	id := "chk-" + uniq()
	status, body := postJSON(t, http.MethodPost, fraud+"/v1/fraud/check", map[string]any{"id": id, "amount_cents": 1200, "region": "us"})
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"allow":true`) {
		t.Fatalf("verdict = %s, want allow", body)
	}
	var stored int
	if err := keyed.Query("SELECT score FROM checks WHERE id = ?", id).Scan(&stored); err != nil {
		t.Fatalf("read check back from scylla: %v", err)
	}
	if stored != 0 {
		t.Fatalf("stored score = %d, want 0", stored)
	}
}

// applyCQLFiles runs each CQL statement of every .cql file in dir.
func applyCQLFiles(t *testing.T, dir string, session *gocql.Session) {
	t.Helper()
	applySQLFilesWithSuffix(t, dir, ".cql", func(stmt string) error {
		return session.Query(stmt).Exec()
	})
}

func putBytes(t *testing.T, url, contentType string, payload []byte) (int, []byte) {
	t.Helper()
	req, err := http.NewRequestWithContext(context.Background(), http.MethodPut, url, bytes.NewReader(payload))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", contentType)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("PUT %s: %v", url, err)
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, out
}

func mergeEnv(a, b map[string]string) map[string]string {
	out := make(map[string]string, len(a)+len(b))
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		out[k] = v
	}
	return out
}
