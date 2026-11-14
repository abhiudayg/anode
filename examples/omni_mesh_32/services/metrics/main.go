package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/ClickHouse/clickhouse-go/v2"
)

type sample struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

func main() {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: strings.Split(os.Getenv("METRICS_CLICKHOUSE_ADDR"), ","),
		Auth: clickhouse.Auth{
			Database: envOr("METRICS_CLICKHOUSE_DB", "metrics"),
			Username: os.Getenv("METRICS_CLICKHOUSE_USER"),
			Password: os.Getenv("METRICS_CLICKHOUSE_PASSWORD"),
		},
	})
	if err != nil {
		log.Fatalf("clickhouse: %v", err)
	}
	defer conn.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/metrics", func(w http.ResponseWriter, r *http.Request) {
		var s sample
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil || s.Name == "" {
			http.Error(w, "invalid sample", http.StatusBadRequest)
			return
		}
		if err := conn.Exec(r.Context(),
			`INSERT INTO samples (name, value, ts) VALUES (?, ?, now())`, s.Name, s.Value); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusAccepted)
	})
	mux.HandleFunc("GET /v1/metrics/{name}/avg", func(w http.ResponseWriter, r *http.Request) {
		var avg float64
		if err := conn.QueryRow(r.Context(),
			`SELECT avg(value) FROM samples WHERE name = ? AND ts > now() - INTERVAL 1 HOUR`,
			r.PathValue("name")).Scan(&avg); err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]float64{"avg_last_hour": avg})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9018"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
