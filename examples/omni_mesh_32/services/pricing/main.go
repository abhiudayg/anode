package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9025"
	}

	valkeyAddr := os.Getenv("PRICING_VALKEY_ADDR")
	rdb := redis.NewClient(&redis.Options{Addr: valkeyAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/pricing/quote", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"price_cents":1999}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
