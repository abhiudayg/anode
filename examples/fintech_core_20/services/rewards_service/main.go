package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/rewards_service/points"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8092"
	}

	pts := points.New()
	defer pts.Close()

	accountsURL := os.Getenv("ACCOUNTS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/rewards/redeem", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", accountsURL+"/v1/accounts/credit", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"points_redeemed": 500,
			"cashback_usd":    5.00,
		})
	})

	log.Printf("[rewards_service] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
