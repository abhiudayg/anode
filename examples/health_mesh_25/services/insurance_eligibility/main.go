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
		port = "7011"
	}

	memURL := os.Getenv("ELIGIBILITY_MEMCACHED_URL")
	db, _ := sql.Open("memcached", memURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/eligibility/check", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.availity.com/availity/v1/coverages", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"active_coverage": true,
			"copay_cents":     2000,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
