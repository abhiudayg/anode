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
		port = "7023"
	}

	qdrantURL := os.Getenv("TRIALS_QDRANT_URL")
	db, _ := sql.Open("qdrant", qdrantURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/trials/match", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"trial_id":     "NCT045182",
			"match_score": 0.89,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
