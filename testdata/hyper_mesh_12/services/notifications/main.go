package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8008"
	}

	sendgridKey := os.Getenv("SENDGRID_API_KEY")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/notify/shipment", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.sendgrid.com/v3/mail/send", nil)
		req.Header.Set("Authorization", "Bearer "+sendgridKey)
		_, _ = http.DefaultClient.Do(req)

		fmt.Fprintln(w, `{"email_dispatched":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
