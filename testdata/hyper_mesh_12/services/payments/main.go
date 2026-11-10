package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8005"
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/payments/charge", func(w http.ResponseWriter, r *http.Request) {
		// External HTTPS call to Stripe
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.stripe.com/v1/charges", nil)
		req.Header.Set("Authorization", "Bearer "+stripeKey)
		_, _ = http.DefaultClient.Do(req)

		fmt.Fprintln(w, `{"payment_id":"pay_888","status":"captured"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
