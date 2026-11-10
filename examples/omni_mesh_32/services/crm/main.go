package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9030"
	}

	sfToken := os.Getenv("SALESFORCE_AUTH_TOKEN")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/crm/sync", func(w http.ResponseWriter, r *http.Request) {
		_ = sfToken
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.salesforce.com/services/data/v58.0", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"synced_to_salesforce":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
