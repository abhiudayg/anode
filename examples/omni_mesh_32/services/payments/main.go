package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9006"
	}

	scyllaURL := os.Getenv("PAYMENTS_SCYLLA_URL")
	stripeKey := os.Getenv("STRIPE_API_SECRET_KEY")

	db, _ := sql.Open("scylladb", scyllaURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/payments/charge", func(w http.ResponseWriter, r *http.Request) {
		_ = stripeKey
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.stripe.com/v1/charges", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"charge_id":"ch_123","status":"succeeded"}`)
	})
	mux.HandleFunc("POST /v1/payments/refund", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"refund_id":"ref_456","status":"refunded"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
