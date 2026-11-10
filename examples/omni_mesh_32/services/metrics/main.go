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
		port = "9028"
	}

	clickURL := os.Getenv("METRICS_CLICKHOUSE_URL")
	db, _ := sql.Open("clickhouse", clickURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/metrics/ingest", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"ingested":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
