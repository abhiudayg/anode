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
		port = "9010"
	}

	rabbitURL := os.Getenv("NOTIFICATIONS_RABBITMQ_URL")
	sendgridKey := os.Getenv("SENDGRID_API_SECRET_TOKEN")

	db, _ := sql.Open("rabbitmq", rabbitURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/notifications/push", func(w http.ResponseWriter, r *http.Request) {
		_ = sendgridKey
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.sendgrid.com/v3/mail/send", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"sent":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
