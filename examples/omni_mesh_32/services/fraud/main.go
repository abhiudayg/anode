package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gocql/gocql"
)

type check struct {
	ID     string `json:"id"`
	Amount int64  `json:"amount_cents"`
	Region string `json:"region"`
}

type verdict struct {
	ID    string `json:"id"`
	Score int    `json:"score"`
	Allow bool   `json:"allow"`
}

func main() {
	cluster := gocql.NewCluster(strings.Split(os.Getenv("FRAUD_SCYLLA_HOSTS"), ",")...)
	cluster.Keyspace = envOr("FRAUD_SCYLLA_KEYSPACE", "fraud")
	cluster.Consistency = gocql.Quorum
	session, err := cluster.CreateSession()
	if err != nil {
		log.Fatalf("scylla: %v", err)
	}
	defer session.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/fraud/check", func(w http.ResponseWriter, r *http.Request) {
		var c check
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.ID == "" {
			http.Error(w, "invalid check", http.StatusBadRequest)
			return
		}
		v := score(c)
		if err := session.Query(
			`INSERT INTO checks (id, amount_cents, region, score, allow) VALUES (?, ?, ?, ?, ?)`,
			c.ID, c.Amount, c.Region, v.Score, v.Allow).WithContext(r.Context()).Exec(); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(v)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9013"), mux))
}

func score(c check) verdict {
	s := 0
	if c.Amount > 500000 {
		s += 40
	}
	if c.Region == "" {
		s += 30
	}
	return verdict{ID: c.ID, Score: s, Allow: s < 60}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
