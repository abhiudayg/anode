package catalog

import "testing"

func TestPrimaryConnectionValueMatchesServiceFormat(t *testing.T) {
	reg := NewRegistry()
	cases := []struct {
		kind string
		port int
		want string
	}{
		{"kafka", 19092, "127.0.0.1:19092"},
		{"scylladb", 9042, "127.0.0.1:9042"},
		{"mongodb", 27017, "mongodb://127.0.0.1:27017/db-x?directConnection=true"},
		{"rabbitmq", 5672, "amqp://anode:test-pass@127.0.0.1:5672/"},
		{"qdrant", 6333, "http://127.0.0.1:6333"},
		{"temporal", 7233, "127.0.0.1:7233"},
		{"memcached", 11211, "127.0.0.1:11211"},
		{"minio", 9000, "127.0.0.1:9000"},
		{"mariadb", 3306, "root:test-pass@tcp(127.0.0.1:3306)/db-x?parseTime=true"},
	}
	for _, c := range cases {
		got, err := reg.Resolve(c.kind).PrimaryConnectionValue("db-x", "127.0.0.1", c.port, "db-x", "test-pass")
		if err != nil {
			t.Fatalf("%s: %v", c.kind, err)
		}
		if got != c.want {
			t.Errorf("%s: got %q, want %q", c.kind, got, c.want)
		}
	}
}

func TestPrimaryConnectionIsRequired(t *testing.T) {
	spec := &DriverSpec{Kind: "unknownkind"}
	if _, err := spec.PrimaryConnectionValue("x", "127.0.0.1", 1, "x", ""); err == nil {
		t.Fatalf("a kind without primary_connection must fail instead of guessing a URL")
	}
}
