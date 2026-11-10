package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	authAddr := os.Getenv("AUTH_SERVICE_URL")
	ordersAddr := os.Getenv("ORDERS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/auth/verify", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", authAddr+"/v1/auth/token", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"auth":true}`)
	})

	mux.HandleFunc("POST /api/v1/orders", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", ordersAddr+"/v1/orders", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
