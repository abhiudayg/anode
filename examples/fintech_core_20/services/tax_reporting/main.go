package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/tax_reporting/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8095"
	}

	st, err := store.New()
	if err != nil {
		log.Fatalf("Tax store error: %v", err)
	}
	defer st.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/tax/1099b", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"year":              2026,
			"capital_gains_usd": 14250.00,
		})
	})

	log.Printf("[tax_reporting] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
