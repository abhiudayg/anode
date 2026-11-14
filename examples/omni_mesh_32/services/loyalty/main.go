package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type pointsGrant struct {
	CustomerID string `json:"customer_id"`
	Points     int64  `json:"points"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("LOYALTY_POSTGRES_DSN"))
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: os.Getenv("LOYALTY_REDIS_ADDR")})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/loyalty/points", func(w http.ResponseWriter, r *http.Request) {
		var g pointsGrant
		if err := json.NewDecoder(r.Body).Decode(&g); err != nil || g.CustomerID == "" || g.Points <= 0 {
			http.Error(w, "invalid grant", http.StatusBadRequest)
			return
		}
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO points_balance (customer_id, balance) VALUES ($1, $2)
			 ON CONFLICT (customer_id) DO UPDATE SET balance = points_balance.balance + EXCLUDED.balance`,
			g.CustomerID, g.Points); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		rdb.Del(r.Context(), "points:"+g.CustomerID)
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/loyalty/points/{customer}", func(w http.ResponseWriter, r *http.Request) {
		customer := r.PathValue("customer")
		if cached, err := rdb.Get(r.Context(), "points:"+customer).Result(); err == nil {
			_, _ = w.Write([]byte(`{"customer_id":"` + customer + `","points":` + cached + `}`))
			return
		}
		var balance int64
		err := pool.QueryRow(r.Context(),
			`SELECT balance FROM points_balance WHERE customer_id = $1`, customer).Scan(&balance)
		if errors.Is(err, pgx.ErrNoRows) {
			balance = 0
		} else if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		rdb.Set(r.Context(), "points:"+customer, strconv.FormatInt(balance, 10), time.Minute)
		_ = json.NewEncoder(w).Encode(map[string]any{"customer_id": customer, "points": balance})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9016"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
