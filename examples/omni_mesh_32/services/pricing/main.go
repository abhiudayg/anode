package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
)

type price struct {
	SKU        string `json:"sku"`
	AmountCent int64  `json:"amount_cents"`
}

func main() {
	valkey := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("PRICING_VALKEY_ADDR"),
		Password: os.Getenv("PRICING_VALKEY_PASSWORD"),
	})
	defer valkey.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("PUT /v1/pricing/{sku}", func(w http.ResponseWriter, r *http.Request) {
		var p price
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil || p.AmountCent < 0 {
			http.Error(w, "invalid price", http.StatusBadRequest)
			return
		}
		if err := valkey.Set(r.Context(), "price:"+r.PathValue("sku"), p.AmountCent, 0).Err(); err != nil {
			http.Error(w, "store unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /v1/pricing/{sku}", func(w http.ResponseWriter, r *http.Request) {
		sku := r.PathValue("sku")
		raw, err := valkey.Get(r.Context(), "price:"+sku).Result()
		if errors.Is(err, redis.Nil) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "store unavailable", http.StatusServiceUnavailable)
			return
		}
		amount, _ := strconv.ParseInt(raw, 10, 64)
		_ = json.NewEncoder(w).Encode(price{SKU: sku, AmountCent: amount})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9022"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
