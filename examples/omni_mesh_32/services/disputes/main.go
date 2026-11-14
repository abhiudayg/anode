package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"go.temporal.io/sdk/client"
)

type dispute struct {
	ID      string `json:"id"`
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

func main() {
	temporal, err := client.Dial(client.Options{HostPort: os.Getenv("DISPUTES_TEMPORAL_ADDR")})
	if err != nil {
		log.Fatalf("temporal: %v", err)
	}
	defer temporal.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/disputes", func(w http.ResponseWriter, r *http.Request) {
		var d dispute
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.ID == "" || d.OrderID == "" {
			http.Error(w, "invalid dispute", http.StatusBadRequest)
			return
		}
		run, err := temporal.ExecuteWorkflow(r.Context(),
			client.StartWorkflowOptions{ID: "dispute-" + d.ID, TaskQueue: "disputes"},
			"DisputeWorkflow", d)
		if err != nil {
			http.Error(w, "could not start review", http.StatusServiceUnavailable)
			return
		}
		holdPayment(d.OrderID)
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"workflow_id": run.GetID(), "run_id": run.GetRunID()})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9010"), mux))
}

func holdPayment(orderID string) {
	body, _ := json.Marshal(map[string]string{"order_id": orderID, "reason": "dispute"})
	resp, err := http.Post(os.Getenv("PAYMENTS_SERVICE_URL")+"/v1/payments/hold", "application/json", bytes.NewReader(body))
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
