//go:build live

package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/worker"
	"go.temporal.io/sdk/workflow"
)

// Runs against a real Temporal server: TEMPORAL_LIVE_ADDR=127.0.0.1:7233 go test -tags live ./services/workflows
func TestReturnWorkflowAgainstTemporalServer(t *testing.T) {
	addr := os.Getenv("TEMPORAL_LIVE_ADDR")
	if addr == "" {
		t.Skip("TEMPORAL_LIVE_ADDR is not set")
	}
	var picks atomic.Int32
	warehouse := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		picks.Add(1)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer warehouse.Close()
	t.Setenv("WAREHOUSE_SERVICE_URL", warehouse.URL)

	c, err := client.Dial(client.Options{HostPort: addr})
	if err != nil {
		t.Fatalf("dial temporal: %v", err)
	}
	defer c.Close()

	queue := "workflows-live-" + time.Now().Format("20060102150405.000000000")
	w := worker.New(c, queue, worker.Options{})
	w.RegisterWorkflowWithOptions(ReturnWorkflow, workflow.RegisterOptions{Name: "ReturnWorkflow"})
	w.RegisterActivity(RequestReturnPickup)
	if err := w.Start(); err != nil {
		t.Fatalf("start worker: %v", err)
	}
	defer w.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	run, err := c.ExecuteWorkflow(ctx, client.StartWorkflowOptions{ID: "return-live-" + queue, TaskQueue: queue},
		"ReturnWorkflow", returnRequest{OrderID: "o-live", SKU: "sku-1", Quantity: 1, FromZip: "10001", ToZip: "94105"})
	if err != nil {
		t.Fatalf("start workflow: %v", err)
	}
	if err := run.Get(ctx, nil); err != nil {
		t.Fatalf("workflow failed on the live server: %v", err)
	}
	if picks.Load() != 1 {
		t.Fatalf("warehouse received %d picks, want 1", picks.Load())
	}
}
