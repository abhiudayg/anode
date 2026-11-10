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
		port = "9014"
	}

	qdrantURL := os.Getenv("RECS_QDRANT_URL")
	redisAddr := os.Getenv("RECS_CACHE_REDIS_ADDR")

	db, _ := sql.Open("qdrant", qdrantURL)
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/recommendations/user", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"recommended_products":["prod_1","prod_2"]}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
