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
		port = "9026"
	}

	pgURL := os.Getenv("LOYALTY_POSTGRES_URL")
	redisAddr := os.Getenv("LOYALTY_REDIS_ADDR")

	db, _ := sql.Open("postgres", pgURL)
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/loyalty/points", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"points":350,"tier":"gold"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
