package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/crypto_custody/vault"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8096"
	}

	v, err := vault.New()
	if err != nil {
		log.Fatalf("Crypto vault error: %v", err)
	}
	defer v.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/crypto/balance", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"asset":     "BTC",
			"balance":   12.4501,
			"cold_tier": "hardware_multisig",
		})
	})

	log.Printf("[crypto_custody] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
