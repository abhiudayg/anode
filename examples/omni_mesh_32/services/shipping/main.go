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

	"github.com/segmentio/kafka-go"
)

type shipmentRequest struct {
	OrderID     string `json:"order_id"`
	ToZip       string `json:"to_zip"`
	FromZip     string `json:"from_zip"`
	WeightOunce int    `json:"weight_ounces"`
}

type shipmentCreated struct {
	OrderID    string `json:"order_id"`
	TrackingID string `json:"tracking_id"`
}

func main() {
	writer := &kafka.Writer{
		Addr:     kafka.TCP(splitHosts(os.Getenv("SHIPPING_KAFKA_BROKERS"))...),
		Topic:    "shipments.created",
		Balancer: &kafka.LeastBytes{},
	}
	defer writer.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/shipments", func(w http.ResponseWriter, r *http.Request) {
		var req shipmentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OrderID == "" || req.ToZip == "" {
			http.Error(w, "invalid shipment", http.StatusBadRequest)
			return
		}
		trackingID, err := createEasyPostShipment(r.Context(), req)
		if err != nil {
			http.Error(w, "carrier unavailable", http.StatusBadGateway)
			return
		}
		event, _ := json.Marshal(shipmentCreated{OrderID: req.OrderID, TrackingID: trackingID})
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		if err := writer.WriteMessages(ctx, kafka.Message{Key: []byte(req.OrderID), Value: event}); err != nil {
			http.Error(w, "event publish failed", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(shipmentCreated{OrderID: req.OrderID, TrackingID: trackingID})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9026"), mux))
}

func createEasyPostShipment(ctx context.Context, req shipmentRequest) (string, error) {
	payload, _ := json.Marshal(map[string]any{
		"shipment": map[string]any{
			"from_address": map[string]string{"zip": req.FromZip, "country": "US"},
			"to_address":   map[string]string{"zip": req.ToZip, "country": "US"},
			"parcel":       map[string]int{"weight": req.WeightOunce},
		},
	})
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, providerURL("EASYPOST_API_URL", "https://api.easypost.com", "/v2/shipments"), bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.SetBasicAuth(os.Getenv("EASYPOST_API_KEY"), "")
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return "", errors.New("easypost rejected the shipment")
	}
	var out struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return out.ID, nil
}

func splitHosts(raw string) []string {
	var out []string
	start := 0
	for i := 0; i <= len(raw); i++ {
		if i == len(raw) || raw[i] == ',' {
			if i > start {
				out = append(out, raw[start:i])
			}
			start = i + 1
		}
	}
	return out
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// providerURL returns the endpoint of an external API. The env var lets tests point it at a local stub; production
// leaves it unset and calls the provider.
func providerURL(env, fallbackBase, path string) string {
	base := os.Getenv(env)
	if base == "" {
		base = fallbackBase
	}
	return base + path
}
