package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9012"
	}

	clickURL := os.Getenv("AUDITLOG_CLICKHOUSE_URL")
	db, _ := sql.Open("clickhouse", clickURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/audit/log", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"logged":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
