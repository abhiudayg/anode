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
		port = "7020"
	}

	pgURL := os.Getenv("MESSAGING_POSTGRES_URL")
	db, _ := sql.Open("postgres", pgURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/portal/message", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"message_sent": true})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
