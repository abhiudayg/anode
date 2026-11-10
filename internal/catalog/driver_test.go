package catalog

import (
	"strings"
	"testing"
)

func TestAllCatalogDriversLeastPrivilege(t *testing.T) {
	reg := NewRegistry()
	kinds := reg.ListKinds()

	if len(kinds) < 20 {
		t.Fatalf("expected at least 20 drivers in default catalog, got %d", len(kinds))
	}

	for _, kind := range kinds {
		driver := reg.Resolve(kind)
		cmd := driver.BuildProvisionCommand("test-res", driver.DefaultVersion, "/var/lib/anode/data/test-res")

		// 1. Must bind exclusively to loopback (127.0.0.1) for zero public exposure
		if !strings.Contains(cmd, "127.0.0.1:") {
			t.Errorf("[%s] driver provision command does NOT bind to 127.0.0.1:\n%s", kind, cmd)
		}

		// 2. Must enforce no-new-privileges
		if !strings.Contains(cmd, "no-new-privileges:true") {
			t.Errorf("[%s] driver missing --security-opt no-new-privileges:true", kind)
		}

		// 3. Must initialize deterministic POSIX permissions (chmod 0700)
		if !strings.Contains(cmd, "install -d -m 0700") {
			t.Errorf("[%s] driver missing install -d -m 0700", kind)
		}

		// 4. Must enforce cgroups memory limit
		if !strings.Contains(cmd, "--memory=") {
			t.Errorf("[%s] driver missing --memory cgroup limit", kind)
		}

		// 5. Must enforce OOM score protection
		if !strings.Contains(cmd, "--oom-score-adj=") {
			t.Errorf("[%s] driver missing --oom-score-adj", kind)
		}
	}
}

func TestDriverConnectionTemplates(t *testing.T) {
	reg := NewRegistry()

	// 1. Postgres Connection Templates
	pg := reg.Resolve("postgres")
	pgEnv := pg.BuildConnectionEnv("orders-db", "127.0.0.1", 5432, "orders")
	if pgEnv["URL"] != "postgres://postgres:postgres@127.0.0.1:5432/orders?sslmode=disable" {
		t.Errorf("unexpected Postgres URL template: %s", pgEnv["URL"])
	}
	if pgEnv["PORT"] != "5432" || pgEnv["HOST"] != "127.0.0.1" {
		t.Errorf("unexpected Postgres host/port env: %v", pgEnv)
	}

	// 2. MySQL Connection Templates
	mysql := reg.Resolve("mysql")
	mysqlEnv := mysql.BuildConnectionEnv("users-db", "127.0.0.1", 3306, "users")
	if mysqlEnv["DSN"] != "root:mysql@tcp(127.0.0.1:3306)/users?parseTime=true" {
		t.Errorf("unexpected MySQL DSN template: %s", mysqlEnv["DSN"])
	}

	// 3. Redis Connection Templates
	redis := reg.Resolve("redis")
	redisEnv := redis.BuildConnectionEnv("cache", "127.0.0.1", 6379, "cache")
	if redisEnv["URL"] != "redis://127.0.0.1:6379" {
		t.Errorf("unexpected Redis URL template: %s", redisEnv["URL"])
	}

	// 4. Kafka Connection Templates
	kafka := reg.Resolve("kafka")
	kafkaEnv := kafka.BuildConnectionEnv("events", "127.0.0.1", 9092, "events")
	if kafkaEnv["BROKERS"] != "127.0.0.1:9092" || kafkaEnv["BOOTSTRAP_SERVERS"] != "127.0.0.1:9092" {
		t.Errorf("unexpected Kafka bootstrap template: %v", kafkaEnv)
	}

	// 5. MinIO Connection Templates
	minio := reg.Resolve("minio")
	minioEnv := minio.BuildConnectionEnv("storage", "127.0.0.1", 9000, "storage")
	if minioEnv["ENDPOINT"] != "http://127.0.0.1:9000" {
		t.Errorf("unexpected MinIO endpoint template: %s", minioEnv["ENDPOINT"])
	}
}

func TestDriverVersionMatrixResolution(t *testing.T) {
	reg := NewRegistry()

	// MySQL versions
	mysql := reg.Resolve("mysql")
	if mysql.ResolveImage("8.0") != "mysql:8.0" {
		t.Errorf("expected mysql:8.0")
	}
	if mysql.ResolveImage("8.4") != "mysql:8.4" {
		t.Errorf("expected mysql:8.4")
	}

	// Redis versions
	redis := reg.Resolve("redis")
	if redis.ResolveImage("6") != "redis:6-alpine" {
		t.Errorf("expected redis:6-alpine")
	}
	if redis.ResolveImage("7") != "redis:7-alpine" {
		t.Errorf("expected redis:7-alpine")
	}

	// Dynamic semver version fallback
	customImg := pgCustomSemver(reg)
	if customImg != "postgres:16.4-alpine" {
		t.Errorf("expected dynamic semver interpolation postgres:16.4-alpine, got %s", customImg)
	}
}

func pgCustomSemver(r *Registry) string {
	pg := r.Resolve("postgres")
	return pg.ResolveImage("16.4")
}
