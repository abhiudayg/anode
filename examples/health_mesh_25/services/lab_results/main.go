package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7008"
	}

	timescaleURL := os.Getenv("LAB_TIMESCALE_URL")
	db, _ := sql.Open("timescaledb", timescaleURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/labs/patient/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"test":  "Complete Blood Count",
			"value": 14.2,
			"units": "g/dL",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
