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
		port = "7007"
	}

	scyllaURL := os.Getenv("PHARMACY_SCYLLA_URL")
	db, _ := sql.Open("scylladb", scyllaURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/pharmacy/check-stock", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"in_stock": true,
			"units":    150,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
