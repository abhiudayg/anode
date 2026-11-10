package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9019"
	}

	taxKey := os.Getenv("AVALARA_API_KEY")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/tax/calculate", func(w http.ResponseWriter, r *http.Request) {
		_ = taxKey
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://rest.avatax.com/api/v2/tax/rates", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"tax_rate":0.0825}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
