package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/mock"
	"go.temporal.io/sdk/testsuite"
)

func TestReturnWorkflowCompletesWhenPickIsRequested(t *testing.T) {
	var suite testsuite.WorkflowTestSuite
	env := suite.NewTestWorkflowEnvironment()
	env.RegisterWorkflow(ReturnWorkflow)
	env.RegisterActivity(RequestReturnPickup)
	req := returnRequest{OrderID: "o-7", SKU: "sku-1", Quantity: 2, FromZip: "10001", ToZip: "94105"}
	env.OnActivity(RequestReturnPickup, mock.Anything, req).Return(nil)

	env.ExecuteWorkflow(ReturnWorkflow, req)

	if !env.IsWorkflowCompleted() {
		t.Fatalf("workflow did not complete")
	}
	if err := env.GetWorkflowError(); err != nil {
		t.Fatalf("workflow failed: %v", err)
	}
}

func TestRequestReturnPickupSendsThePick(t *testing.T) {
	var got map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/warehouse/picks" {
			t.Errorf("path = %s, want /v1/warehouse/picks", r.URL.Path)
		}
		_ = json.NewDecoder(r.Body).Decode(&got)
		w.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()
	t.Setenv("WAREHOUSE_SERVICE_URL", server.URL)

	err := RequestReturnPickup(context.Background(), returnRequest{OrderID: "o-7", SKU: "sku-1", Quantity: 2, FromZip: "10001", ToZip: "94105"})
	if err != nil {
		t.Fatalf("RequestReturnPickup: %v", err)
	}
	if got["order_id"] != "o-7" || got["sku"] != "sku-1" || got["quantity"] != float64(2) {
		t.Fatalf("pick = %v", got)
	}
}

func TestRequestReturnPickupFailsSoTemporalRetries(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()
	t.Setenv("WAREHOUSE_SERVICE_URL", server.URL)

	if err := RequestReturnPickup(context.Background(), returnRequest{OrderID: "o-7", Quantity: 1}); err == nil {
		t.Fatalf("a warehouse error must fail the activity so Temporal retries it")
	}
}
