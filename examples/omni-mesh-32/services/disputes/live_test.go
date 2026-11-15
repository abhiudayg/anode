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

// Runs against a real Temporal server: TEMPORAL_LIVE_ADDR=127.0.0.1:7233 go test -tags live ./services/disputes
func TestDisputeWorkflowAgainstTemporalServer(t *testing.T) {
	addr := os.Getenv("TEMPORAL_LIVE_ADDR")
	if addr == "" {
		t.Fatal("TEMPORAL_LIVE_ADDR is not set: run infra/live-test.sh")
	}
	var audited atomic.Int32
	audit := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		audited.Add(1)
		w.WriteHeader(http.StatusCreated)
	}))
	defer audit.Close()
	t.Setenv("AUDITLOG_SERVICE_URL", audit.URL)

	c := dialWithRetry(t, addr)
	defer c.Close()

	queue := "disputes-live-" + time.Now().Format("20060102150405.000000000")
	w := worker.New(c, queue, worker.Options{})
	w.RegisterWorkflowWithOptions(DisputeWorkflow, workflow.RegisterOptions{Name: "DisputeWorkflow"})
	w.RegisterActivity(RecordDisputeOpened)
	if err := w.Start(); err != nil {
		t.Fatalf("start worker: %v", err)
	}
	defer w.Stop()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	run, err := c.ExecuteWorkflow(ctx, client.StartWorkflowOptions{ID: "dispute-live-" + queue, TaskQueue: queue},
		"DisputeWorkflow", dispute{ID: "live-1", OrderID: "o-1", Reason: "live"})
	if err != nil {
		t.Fatalf("start workflow: %v", err)
	}
	if err := run.Get(ctx, nil); err != nil {
		t.Fatalf("workflow failed on the live server: %v", err)
	}
	if audited.Load() != 1 {
		t.Fatalf("audit log received %d records, want 1", audited.Load())
	}
}

// dialWithRetry waits for the Temporal server to answer gRPC. The port can accept TCP before the server is ready.
func dialWithRetry(t *testing.T, addr string) client.Client {
	t.Helper()
	deadline := time.Now().Add(90 * time.Second)
	for {
		c, err := client.Dial(client.Options{HostPort: addr})
		if err == nil {
			return c
		}
		if time.Now().After(deadline) {
			t.Fatalf("temporal is not ready: %v", err)
		}
		time.Sleep(time.Second)
	}
}
