package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ledgerEntry struct {
	Account     string `json:"account"`
	AmountCents int64  `json:"amount_cents"`
	Memo        string `json:"memo"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("ACCOUNTING_TIMESCALE_DSN"))
	if err != nil {
		log.Fatalf("timescale: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/ledger/entries", func(w http.ResponseWriter, r *http.Request) {
		var e ledgerEntry
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil || e.Account == "" {
			http.Error(w, "invalid entry", http.StatusBadRequest)
			return
		}
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO ledger_entries (account, amount_cents, memo, created_at) VALUES ($1, $2, $3, now())`,
			e.Account, e.AmountCents, e.Memo); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/ledger/balance/{account}", func(w http.ResponseWriter, r *http.Request) {
		var balance int64
		err := pool.QueryRow(r.Context(),
			`SELECT COALESCE(SUM(amount_cents), 0) FROM ledger_entries WHERE account = $1`,
			r.PathValue("account")).Scan(&balance)
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]int64{"balance_cents": balance})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9001"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
