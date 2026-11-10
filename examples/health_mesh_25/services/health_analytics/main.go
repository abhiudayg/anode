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
		port = "7024"
	}

	clickURL := os.Getenv("ANALYTICS_CLICKHOUSE_URL")
	db, _ := sql.Open("clickhouse", clickURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/epidemiology/stats", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"flu_incidence_rate": 0.032,
			"bed_occupancy_pct":  88.5,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
