package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9007"
	}

	mariadbURL := os.Getenv("INVENTORY_MARIADB_URL")
	redisAddr := os.Getenv("INVENTORY_LOCKS_REDIS_ADDR")

	db, _ := sql.Open("mariadb", mariadbURL)
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/inventory/reserve", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"reserved":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
