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
		port = "8006"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: os.Getenv("INVENTORY_REDIS_ADDR"),
	})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/inventory/reserve", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"reserved":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
