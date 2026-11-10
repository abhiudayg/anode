package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/market_data/client"
	"fintech_core_20/services/market_data/stream"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8085"
	}

	st := stream.New()
	defer st.Close()

	cg := client.New()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/market/prices", func(w http.ResponseWriter, r *http.Request) {
		_ = cg.FetchPrices(r.Context())
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]float64{
			"BTC/USD": 98520.00,
			"ETH/USD": 3410.50,
		})
	})

	log.Printf("[market_data] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
