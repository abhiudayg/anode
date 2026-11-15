package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type message struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

const outboundQueue = "email.outbound"

func main() {
	conn, err := amqp.Dial(os.Getenv("EMAIL_RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("rabbitmq: %v", err)
	}
	defer conn.Close()
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("rabbitmq channel: %v", err)
	}
	defer ch.Close()
	if _, err := ch.QueueDeclare(outboundQueue, true, false, false, false, nil); err != nil {
		log.Fatalf("declare queue: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/email/send", func(w http.ResponseWriter, r *http.Request) {
		var m message
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil || m.To == "" {
			http.Error(w, "invalid message", http.StatusBadRequest)
			return
		}
		body, _ := json.Marshal(m)
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		if err := ch.PublishWithContext(ctx, "", outboundQueue, false, false,
			amqp.Publishing{ContentType: "application/json", Body: body}); err != nil {
			http.Error(w, "queue unavailable", http.StatusServiceUnavailable)
			return
		}
		recordAudit(m.To)
		w.WriteHeader(http.StatusAccepted)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9012"), mux))
}

func recordAudit(target string) {
	body, _ := json.Marshal(map[string]string{"actor": "email", "action": "sent", "target": target})
	resp, err := http.Post(os.Getenv("AUDITLOG_SERVICE_URL")+"/v1/audit", "application/json", bytes.NewReader(body))
	if err == nil {
		resp.Body.Close()
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
