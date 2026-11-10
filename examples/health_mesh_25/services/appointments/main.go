package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7004"
	}

	mariadbURL := os.Getenv("APPOINTMENTS_MARIADB_URL")
	redisAddr := os.Getenv("APPOINTMENTS_LOCKS_REDIS_ADDR")

	db, _ := sql.Open("mariadb", mariadbURL)
	defer db.Close()

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/appointments/book", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"appointment_id": "appt_982",
			"status":         "confirmed",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
