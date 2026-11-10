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
		port = "7006"
	}

	cockroachURL := os.Getenv("PRESCRIPTIONS_COCKROACH_URL")
	pharmacyURL := os.Getenv("PHARMACY_INVENTORY_URL")

	db, _ := sql.Open("cockroachdb", cockroachURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/prescriptions/issue", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", pharmacyURL+"/v1/pharmacy/check-stock", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"rx_id":  "rx_9921",
			"status": "transmitted_to_pharmacy",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
