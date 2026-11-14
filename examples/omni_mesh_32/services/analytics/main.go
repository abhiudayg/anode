package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/ClickHouse/clickhouse-go/v2"
)

type event struct {
	Name   string `json:"name"`
	UserID string `json:"user_id"`
}

func main() {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: strings.Split(os.Getenv("ANALYTICS_CLICKHOUSE_ADDR"), ","),
		Auth: clickhouse.Auth{
			Database: envOr("ANALYTICS_CLICKHOUSE_DB", "analytics"),
			Username: os.Getenv("ANALYTICS_CLICKHOUSE_USER"),
			Password: os.Getenv("ANALYTICS_CLICKHOUSE_PASSWORD"),
		},
	})
	if err != nil {
		log.Fatalf("clickhouse: %v", err)
	}
	defer conn.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/events", func(w http.ResponseWriter, r *http.Request) {
		var ev event
		if err := json.NewDecoder(r.Body).Decode(&ev); err != nil || ev.Name == "" {
			http.Error(w, "invalid event", http.StatusBadRequest)
			return
		}
		if err := conn.Exec(context.Background(),
			`INSERT INTO events (name, user_id, ts) VALUES (?, ?, now())`, ev.Name, ev.UserID); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusAccepted)
	})
	mux.HandleFunc("GET /v1/events/count", func(w http.ResponseWriter, r *http.Request) {
		var n uint64
		if err := conn.QueryRow(r.Context(), `SELECT count() FROM events`).Scan(&n); err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]uint64{"events": n})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9002"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
