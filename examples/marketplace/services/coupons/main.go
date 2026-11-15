package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/bradfitz/gomemcache/memcache"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type coupon struct {
	Code       string `json:"code"`
	PercentOff int    `json:"percent_off"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("COUPONS_POSTGRES_DSN"))
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	cache := memcache.New(os.Getenv("COUPONS_MEMCACHED_ADDR"))

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/coupons", func(w http.ResponseWriter, r *http.Request) {
		var c coupon
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.Code == "" || c.PercentOff <= 0 || c.PercentOff > 100 {
			http.Error(w, "invalid coupon", http.StatusBadRequest)
			return
		}
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO coupons (code, percent_off) VALUES ($1, $2)`, c.Code, c.PercentOff); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		_ = cache.Set(&memcache.Item{Key: "coupon:" + c.Code, Value: []byte(strconv.Itoa(c.PercentOff)), Expiration: 300})
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/coupons/{code}", func(w http.ResponseWriter, r *http.Request) {
		code := r.PathValue("code")
		if item, err := cache.Get("coupon:" + code); err == nil {
			percent, _ := strconv.Atoi(string(item.Value))
			_ = json.NewEncoder(w).Encode(coupon{Code: code, PercentOff: percent})
			return
		}
		var c coupon
		err := pool.QueryRow(r.Context(),
			`SELECT code, percent_off FROM coupons WHERE code = $1`, code).Scan(&c.Code, &c.PercentOff)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(c)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9008"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
