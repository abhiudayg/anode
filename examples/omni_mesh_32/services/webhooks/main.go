package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type dispatch struct {
	EventType string          `json:"event_type"`
	TargetURL string          `json:"target_url"`
	Payload   json.RawMessage `json:"payload"`
}

const dispatchQueue = "webhooks.dispatch"

func main() {
	conn, err := amqp.Dial(os.Getenv("WEBHOOKS_RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("rabbitmq: %v", err)
	}
	defer conn.Close()
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("rabbitmq channel: %v", err)
	}
	defer ch.Close()
	if _, err := ch.QueueDeclare(dispatchQueue, true, false, false, false, nil); err != nil {
		log.Fatalf("declare queue: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/webhooks/dispatch", func(w http.ResponseWriter, r *http.Request) {
		var d dispatch
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.EventType == "" || d.TargetURL == "" {
			http.Error(w, "invalid dispatch", http.StatusBadRequest)
			return
		}
		body, _ := json.Marshal(d)
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		if err := ch.PublishWithContext(ctx, "", dispatchQueue, false, false,
			amqp.Publishing{ContentType: "application/json", Body: body}); err != nil {
			http.Error(w, "queue unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusAccepted)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9031"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
