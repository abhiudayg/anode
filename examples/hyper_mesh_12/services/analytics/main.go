package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
)

// Dead helper: Must be mathematically pruned by VTA
func deadAnalyticsHelper() {
	_, _ = sql.Open("sqlite3", os.Getenv("UNUSED_SQLITE_PATH"))
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8010"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/analytics/summary", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"daily_volume":98432}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
