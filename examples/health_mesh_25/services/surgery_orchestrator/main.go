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
		port = "7018"
	}

	temporalURL := os.Getenv("SURGERY_TEMPORAL_URL")
	db, _ := sql.Open("temporal", temporalURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/surgery/schedule-or", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"or_room":    "OR_Suite_4",
			"workflow":   "perioperative_prep_started",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
