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

type auditRecord struct {
	Actor  string `json:"actor"`
	Action string `json:"action"`
	Target string `json:"target"`
}

func main() {
	conn, err := clickhouse.Open(&clickhouse.Options{
		Addr: strings.Split(os.Getenv("AUDITLOG_CLICKHOUSE_ADDR"), ","),
		Auth: clickhouse.Auth{
			Database: envOr("AUDITLOG_CLICKHOUSE_DB", "audit"),
			Username: os.Getenv("AUDITLOG_CLICKHOUSE_USER"),
			Password: os.Getenv("AUDITLOG_CLICKHOUSE_PASSWORD"),
		},
	})
	if err != nil {
		log.Fatalf("clickhouse: %v", err)
	}
	defer conn.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/audit", func(w http.ResponseWriter, r *http.Request) {
		var rec auditRecord
		if err := json.NewDecoder(r.Body).Decode(&rec); err != nil || rec.Action == "" {
			http.Error(w, "invalid record", http.StatusBadRequest)
			return
		}
		if err := conn.Exec(context.Background(),
			`INSERT INTO audit_log (actor, action, target, ts) VALUES (?, ?, ?, now())`,
			rec.Actor, rec.Action, rec.Target); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/audit/recent", func(w http.ResponseWriter, r *http.Request) {
		rows, err := conn.Query(r.Context(),
			`SELECT actor, action, target FROM audit_log ORDER BY ts DESC LIMIT 50`)
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		out := []auditRecord{}
		for rows.Next() {
			var rec auditRecord
			if err := rows.Scan(&rec.Actor, &rec.Action, &rec.Target); err != nil {
				http.Error(w, "read failed", http.StatusInternalServerError)
				return
			}
			out = append(out, rec)
		}
		_ = json.NewEncoder(w).Encode(out)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9004"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
