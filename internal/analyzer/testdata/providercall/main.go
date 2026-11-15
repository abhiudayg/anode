package main

import (
	"bytes"
	"context"
	"net/http"
	"os"
)

func providerURL(env, fallbackBase, path string) string {
	base := os.Getenv(env)
	if base == "" {
		base = fallbackBase
	}
	return base + path
}

func charge(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, providerURL("PAY_API_URL", "https://api.example-pay.test", "/v1/charges"), bytes.NewReader(nil))
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
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {})
	_ = charge(context.Background())
	_ = http.ListenAndServe(":9000", mux)
}
