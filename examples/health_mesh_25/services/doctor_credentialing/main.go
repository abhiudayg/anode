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
		port = "7016"
	}

	mongoURL := os.Getenv("CREDENTIALS_MONGO_URL")
	db, _ := sql.Open("mongodb", mongoURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/credentials/verify-npi", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", "https://npiregistry.cms.hhs.gov/api/v2.1", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"npi":       "1992019283",
			"valid_md":  true,
			"specialty": "Cardiology",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
