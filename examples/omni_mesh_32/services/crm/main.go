package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
)

type contact struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/crm/contacts", func(w http.ResponseWriter, r *http.Request) {
		var c contact
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.Email == "" {
			http.Error(w, "invalid contact", http.StatusBadRequest)
			return
		}
		body, _ := json.Marshal(map[string]string{
			"FirstName": c.FirstName,
			"LastName":  c.LastName,
			"Email":     c.Email,
		})
		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
			"https://api.salesforce.com/services/data/v58.0/sobjects/Contact", bytes.NewReader(body))
		if err != nil {
			http.Error(w, "request failed", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+os.Getenv("SALESFORCE_ACCESS_TOKEN"))
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			http.Error(w, "salesforce unreachable", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()
		w.WriteHeader(resp.StatusCode)
		_, _ = io.Copy(w, resp.Body)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9009"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
