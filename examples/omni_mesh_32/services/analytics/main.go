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
		port = "9013"
	}

	clickURL := os.Getenv("ANALYTICS_CLICKHOUSE_URL")
	db, _ := sql.Open("clickhouse", clickURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/analytics/stats", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"daily_active_users":42000}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
