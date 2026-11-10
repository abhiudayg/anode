package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/currency_fx/cache"
	"fintech_core_20/services/currency_fx/rates"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	c, err := cache.New()
	if err != nil {
		log.Fatalf("Cache error: %v", err)
	}
	defer c.Close()

	r := rates.New()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/fx/convert", func(w http.ResponseWriter, req *http.Request) {
		_ = r.FetchRates(req.Context())
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"rate":   1.085,
			"source": "EUR",
			"target": "USD",
		})
	})

	log.Printf("[currency_fx] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
