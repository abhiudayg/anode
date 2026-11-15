package main

import (
	"net/http"
	"os"
	"strings"

	"github.com/segmentio/kafka-go"
)

func splitHosts(raw string) []string {
	return strings.Split(raw, ",")
}

func qdrant(r *http.Request, path string) error {
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, os.Getenv("SEARCH_QDRANT_URL")+path, nil)
	if err != nil {
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	return resp.Body.Close()
}

func main() {
	writer := &kafka.Writer{
		Addr:  kafka.TCP(splitHosts(os.Getenv("ORDERS_KAFKA_BROKERS"))...),
		Topic: "orders.created",
	}
	_ = writer

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		_ = qdrant(r, "/collections")
	})
	_ = http.ListenAndServe(":8080", mux)
}
