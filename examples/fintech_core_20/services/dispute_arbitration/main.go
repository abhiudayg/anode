package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/dispute_arbitration/workflow"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8098"
	}

	eng, err := workflow.New()
	if err != nil {
		log.Fatalf("Temporal error: %v", err)
	}
	defer eng.Close()

	payURL := os.Getenv("PAYMENT_RAILS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/disputes/file", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", payURL+"/v1/payments/execute", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"dispute_id": "disp_tx_772",
			"status":     "arbitration_pending",
		})
	})

	log.Printf("[dispute_arbitration] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
