package main

import (
	"bytes"
	"context"
	"net/http"
	"os"

	"example.com/stores/go.temporal.io/sdk/worker"
)

func notifyAudit(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, os.Getenv("AUDIT_SERVICE_URL")+"/v1/audit", bytes.NewReader(nil))
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
	w := worker.New("disputes")
	w.RegisterActivity(notifyAudit)
	_ = w.Start()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {})
	_ = http.ListenAndServe(":9000", mux)
}
