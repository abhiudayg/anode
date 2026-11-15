package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
	"go.temporal.io/sdk/workflow"
)

type dispute struct {
	ID      string `json:"id"`
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

const disputesQueue = "disputes"

func main() {
	temporal, err := client.Dial(client.Options{HostPort: os.Getenv("DISPUTES_TEMPORAL_ADDR")})
	if err != nil {
		log.Fatalf("temporal: %v", err)
	}
	defer temporal.Close()

	w := worker.New(temporal, disputesQueue, worker.Options{})
	w.RegisterWorkflowWithOptions(DisputeWorkflow, workflow.RegisterOptions{Name: "DisputeWorkflow"})
	w.RegisterActivity(RecordDisputeOpened)
	if err := w.Start(); err != nil {
		log.Fatalf("temporal worker: %v", err)
	}
	defer w.Stop()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/disputes", func(w http.ResponseWriter, r *http.Request) {
		var d dispute
		if err := json.NewDecoder(r.Body).Decode(&d); err != nil || d.ID == "" || d.OrderID == "" {
			http.Error(w, "invalid dispute", http.StatusBadRequest)
			return
		}
		run, err := temporal.ExecuteWorkflow(r.Context(),
			client.StartWorkflowOptions{ID: "dispute-" + d.ID, TaskQueue: disputesQueue},
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

// DisputeWorkflow records a newly opened dispute in the audit log.
func DisputeWorkflow(ctx workflow.Context, d dispute) error {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{StartToCloseTimeout: 30 * time.Second})
	return workflow.ExecuteActivity(ctx, RecordDisputeOpened, d).Get(ctx, nil)
}

// RecordDisputeOpened posts the dispute to the audit log. A non-success response is an error, so Temporal retries it.
func RecordDisputeOpened(ctx context.Context, d dispute) error {
	body, _ := json.Marshal(map[string]string{"actor": "disputes", "action": "opened", "target": d.ID})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, os.Getenv("AUDITLOG_SERVICE_URL")+"/v1/audit", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("audit log returned %d", resp.StatusCode)
	}
	return nil
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
