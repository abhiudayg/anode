package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/notifications/queue"
	"fintech_core_20/services/notifications/twilio"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8094"
	}

	q, err := queue.New()
	if err != nil {
		log.Fatalf("Queue error: %v", err)
	}
	defer q.Close()

	tw := twilio.New()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/notifications/sms", func(w http.ResponseWriter, r *http.Request) {
		_ = tw.SendSMS(r.Context())
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"sent": true})
	})

	log.Printf("[notifications] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
