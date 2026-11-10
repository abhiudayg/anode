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
		port = "9029"
	}

	rabbitURL := os.Getenv("WEBHOOKS_RABBITMQ_URL")
	hmacSecret := os.Getenv("WEBHOOK_HMAC_SECRET")

	db, _ := sql.Open("rabbitmq", rabbitURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/webhooks/dispatch", func(w http.ResponseWriter, r *http.Request) {
		_ = hmacSecret
		fmt.Fprintln(w, `{"dispatched":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
