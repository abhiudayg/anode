package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/cards_service/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8091"
	}

	st, err := store.New()
	if err != nil {
		log.Fatalf("MariaDB store error: %v", err)
	}
	defer st.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/cards/list", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"cards": []map[string]string{
				{"id": "card_01", "last4": "4242", "brand": "Visa"},
			},
		})
	})

	log.Printf("[cards_service] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
