package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/loan_underwriting/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8097"
	}

	st, err := store.New()
	if err != nil {
		log.Fatalf("Loan store error: %v", err)
	}
	defer st.Close()

	accountsURL := os.Getenv("ACCOUNTS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/loans/apply", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", accountsURL+"/v1/accounts/me", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"loan_id":       "loan_app_9918",
			"decision":      "pre_approved",
			"max_limit_usd": 25000.00,
		})
	})

	log.Printf("[loan_underwriting] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
