package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type notification struct {
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

const eventsQueue = "notifications.events"

func main() {
	conn, err := amqp.Dial(os.Getenv("NOTIFICATIONS_RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("rabbitmq: %v", err)
	}
	defer conn.Close()
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("rabbitmq channel: %v", err)
	}
	defer ch.Close()
	if _, err := ch.QueueDeclare(eventsQueue, true, false, false, false, nil); err != nil {
		log.Fatalf("declare queue: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/notifications", func(w http.ResponseWriter, r *http.Request) {
		var n notification
		if err := json.NewDecoder(r.Body).Decode(&n); err != nil || n.Email == "" {
			http.Error(w, "invalid notification", http.StatusBadRequest)
			return
		}
		if err := sendViaSendGrid(r.Context(), n); err != nil {
			http.Error(w, "email provider unavailable", http.StatusBadGateway)
			return
		}
		event, _ := json.Marshal(n)
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		_ = ch.PublishWithContext(ctx, "", eventsQueue, false, false,
			amqp.Publishing{ContentType: "application/json", Body: event})
		w.WriteHeader(http.StatusAccepted)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9019"), mux))
}

func sendViaSendGrid(ctx context.Context, n notification) error {
	payload := map[string]any{
		"personalizations": []map[string]any{{"to": []map[string]string{{"email": n.Email}}}},
		"from":             map[string]string{"email": envOr("NOTIFICATIONS_FROM_EMAIL", "no-reply@example.com")},
		"subject":          n.Subject,
		"content":          []map[string]string{{"type": "text/plain", "value": n.Body}},
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.sendgrid.com/v3/mail/send", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("SENDGRID_API_KEY"))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return errSendGrid
	}
	return nil
}

var errSendGrid = errors.New("sendgrid rejected the message")

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
