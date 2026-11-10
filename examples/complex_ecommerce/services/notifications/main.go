package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

type Config struct {
	Port         string
	SendGridKey  string
	TwilioSecret string
}

func loadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	return &Config{
		Port:         port,
		SendGridKey:  os.Getenv("SENDGRID_API_KEY"),
		TwilioSecret: os.Getenv("TWILIO_AUTH_TOKEN"),
	}
}

func main() {
	cfg := loadConfig()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/notifications/email", func(w http.ResponseWriter, r *http.Request) {
		// External call to SendGrid
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.sendgrid.com/v3/mail/send", nil)
		_, _ = http.DefaultClient.Do(req)

		fmt.Fprintln(w, `{"status":"email_sent"}`)
	})

	addr := ":" + cfg.Port
	log.Printf("Notifications service listening on %s", addr)
	_ = http.ListenAndServe(addr, mux)
}
