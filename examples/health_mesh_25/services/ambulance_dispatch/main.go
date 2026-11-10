package main

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7017"
	}

	valkeyAddr := os.Getenv("DISPATCH_VALKEY_ADDR")
	rdb := redis.NewClient(&redis.Options{Addr: valkeyAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/dispatch/ambulance", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"unit": "Medic_42",
			"eta":  "4 mins",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
