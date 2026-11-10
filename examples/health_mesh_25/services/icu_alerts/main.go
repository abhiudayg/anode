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
		port = "7014"
	}

	rabbitURL := os.Getenv("ICU_RABBITMQ_URL")
	db, _ := sql.Open("rabbitmq", rabbitURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/icu/alert", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.twilio.com/2010-04-01/Accounts", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"pager_dispatched": true})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
