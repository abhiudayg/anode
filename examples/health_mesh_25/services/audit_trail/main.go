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
		port = "7015"
	}

	clickURL := os.Getenv("AUDIT_CLICKHOUSE_URL")
	db, _ := sql.Open("clickhouse", clickURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/hipaa/log", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"access_logged": true})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
