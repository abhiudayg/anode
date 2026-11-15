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

type pick struct {
	OrderID  string `json:"order_id"`
	SKU      string `json:"sku"`
	Quantity int    `json:"quantity"`
	ToZip    string `json:"to_zip"`
	FromZip  string `json:"from_zip"`
}

const picksQueue = "warehouse.picks"

func main() {
	conn, err := amqp.Dial(os.Getenv("WAREHOUSE_RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("rabbitmq: %v", err)
	}
	defer conn.Close()
	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("rabbitmq channel: %v", err)
	}
	defer ch.Close()
	if _, err := ch.QueueDeclare(picksQueue, true, false, false, false, nil); err != nil {
		log.Fatalf("declare queue: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/warehouse/picks", func(w http.ResponseWriter, r *http.Request) {
		var p pick
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil || p.OrderID == "" || p.Quantity <= 0 {
			http.Error(w, "invalid pick", http.StatusBadRequest)
			return
		}
		body, _ := json.Marshal(p)
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		if err := ch.PublishWithContext(ctx, "", picksQueue, false, false,
			amqpPublishing(body)); err != nil {
			http.Error(w, "queue unavailable", http.StatusServiceUnavailable)
			return
		}
		requestShipment(p)
		w.WriteHeader(http.StatusAccepted)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9030"), mux))
}

func amqpPublishing(body []byte) amqp.Publishing {
	return amqp.Publishing{ContentType: "application/json", Body: body}
}

func requestShipment(p pick) {
	body, _ := json.Marshal(map[string]string{
		"order_id": p.OrderID,
		"to_zip":   p.ToZip,
		"from_zip": p.FromZip,
	})
	resp, err := http.Post(os.Getenv("SHIPPING_SERVICE_URL")+"/v1/shipments", "application/json", bytes.NewReader(body))
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
