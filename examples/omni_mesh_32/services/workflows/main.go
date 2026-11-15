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

type returnRequest struct {
	OrderID  string `json:"order_id"`
	SKU      string `json:"sku"`
	Quantity int    `json:"quantity"`
	FromZip  string `json:"from_zip"`
	ToZip    string `json:"to_zip"`
}

const workflowsQueue = "workflows"

func main() {
	temporal, err := client.Dial(client.Options{HostPort: os.Getenv("WORKFLOWS_TEMPORAL_ADDR")})
	if err != nil {
		log.Fatalf("temporal: %v", err)
	}
	defer temporal.Close()

	w := worker.New(temporal, workflowsQueue, worker.Options{})
	w.RegisterWorkflowWithOptions(ReturnWorkflow, workflow.RegisterOptions{Name: "ReturnWorkflow"})
	w.RegisterActivity(RequestReturnPickup)
	if err := w.Start(); err != nil {
		log.Fatalf("temporal worker: %v", err)
	}
	defer w.Stop()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/workflows/returns/{id}", func(w http.ResponseWriter, r *http.Request) {
		var req returnRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OrderID == "" || req.Quantity <= 0 {
			http.Error(w, "invalid return request", http.StatusBadRequest)
			return
		}
		run, err := temporal.ExecuteWorkflow(r.Context(),
			client.StartWorkflowOptions{ID: "return-" + r.PathValue("id"), TaskQueue: workflowsQueue},
			"ReturnWorkflow", req)
		if err != nil {
			http.Error(w, "could not start workflow", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"workflow_id": run.GetID(), "run_id": run.GetRunID()})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9032"), mux))
}

// ReturnWorkflow asks the warehouse to pick the returned items for shipment back.
func ReturnWorkflow(ctx workflow.Context, req returnRequest) error {
	ctx = workflow.WithActivityOptions(ctx, workflow.ActivityOptions{StartToCloseTimeout: 30 * time.Second})
	return workflow.ExecuteActivity(ctx, RequestReturnPickup, req).Get(ctx, nil)
}

// RequestReturnPickup asks the warehouse service for a pick. A non-success response is an error, so Temporal retries it.
func RequestReturnPickup(ctx context.Context, req returnRequest) error {
	body, _ := json.Marshal(map[string]any{
		"order_id": req.OrderID, "sku": req.SKU, "quantity": req.Quantity, "from_zip": req.FromZip, "to_zip": req.ToZip,
	})
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, os.Getenv("WAREHOUSE_SERVICE_URL")+"/v1/warehouse/picks", bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("warehouse returned %d", resp.StatusCode)
	}
	return nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
