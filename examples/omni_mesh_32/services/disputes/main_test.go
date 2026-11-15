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

func TestDisputeWorkflowCompletesWhenAuditRecordIsWritten(t *testing.T) {
	var suite testsuite.WorkflowTestSuite
	env := suite.NewTestWorkflowEnvironment()
	env.RegisterWorkflow(DisputeWorkflow)
	env.RegisterActivity(RecordDisputeOpened)
	d := dispute{ID: "d-1", OrderID: "o-1", Reason: "not received"}
	env.OnActivity(RecordDisputeOpened, mock.Anything, d).Return(nil)

	env.ExecuteWorkflow(DisputeWorkflow, d)

	if !env.IsWorkflowCompleted() {
		t.Fatalf("workflow did not complete")
	}
	if err := env.GetWorkflowError(); err != nil {
		t.Fatalf("workflow failed: %v", err)
	}
}

func TestRecordDisputeOpenedPostsToAuditLog(t *testing.T) {
	var got map[string]string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/audit" {
			t.Errorf("path = %s, want /v1/audit", r.URL.Path)
		}
		_ = json.NewDecoder(r.Body).Decode(&got)
		w.WriteHeader(http.StatusCreated)
	}))
	defer server.Close()
	t.Setenv("AUDITLOG_SERVICE_URL", server.URL)

	if err := RecordDisputeOpened(context.Background(), dispute{ID: "d-9"}); err != nil {
		t.Fatalf("RecordDisputeOpened: %v", err)
	}
	if got["actor"] != "disputes" || got["action"] != "opened" || got["target"] != "d-9" {
		t.Fatalf("audit record = %v", got)
	}
}

func TestRecordDisputeOpenedFailsSoTemporalRetries(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()
	t.Setenv("AUDITLOG_SERVICE_URL", server.URL)

	if err := RecordDisputeOpened(context.Background(), dispute{ID: "d-9"}); err == nil {
		t.Fatalf("an audit log error must fail the activity so Temporal retries it")
	}
}
