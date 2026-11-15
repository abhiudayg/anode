package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /v1/tax/rates", func(w http.ResponseWriter, r *http.Request) {
		postal := r.URL.Query().Get("postal_code")
		if postal == "" {
			http.Error(w, "postal_code is required", http.StatusBadRequest)
			return
		}
		req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, "https://rest.avatax.com/api/v2/tax/rates", nil)
		if err != nil {
			http.Error(w, "request failed", http.StatusInternalServerError)
			return
		}
		req.URL.RawQuery = url.Values{"postalCode": {postal}}.Encode()
		req.SetBasicAuth(os.Getenv("AVATAX_ACCOUNT_ID"), os.Getenv("AVATAX_LICENSE_KEY"))
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "tax service unavailable", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9028"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
