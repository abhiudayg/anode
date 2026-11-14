package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type subscription struct {
	ID         string    `json:"id"`
	CustomerID string    `json:"customer_id"`
	Plan       string    `json:"plan"`
	RenewsAt   time.Time `json:"renews_at"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("SUBSCRIPTIONS_COCKROACH_DSN"))
	if err != nil {
		log.Fatalf("cockroach: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/subscriptions", func(w http.ResponseWriter, r *http.Request) {
		var s subscription
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil || s.ID == "" || s.CustomerID == "" || s.Plan == "" {
			http.Error(w, "invalid subscription", http.StatusBadRequest)
			return
		}
		s.RenewsAt = time.Now().UTC().AddDate(0, 1, 0)
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO subscriptions (id, customer_id, plan, renews_at) VALUES ($1, $2, $3, $4)`,
			s.ID, s.CustomerID, s.Plan, s.RenewsAt); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(s)
	})
	mux.HandleFunc("GET /v1/subscriptions/{id}", func(w http.ResponseWriter, r *http.Request) {
		var s subscription
		err := pool.QueryRow(r.Context(),
			`SELECT id, customer_id, plan, renews_at FROM subscriptions WHERE id = $1`, r.PathValue("id")).
			Scan(&s.ID, &s.CustomerID, &s.Plan, &s.RenewsAt)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(s)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9027"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
