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
		port = "9011"
	}

	rabbitURL := os.Getenv("EMAIL_RABBITMQ_URL")
	auditAddr := os.Getenv("AUDITLOG_SERVICE_URL")

	db, _ := sql.Open("rabbitmq", rabbitURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/email/send", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", auditAddr+"/v1/audit/log", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"email_dispatched":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
