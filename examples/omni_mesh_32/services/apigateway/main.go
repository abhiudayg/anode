package main

import (
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	authAddr := os.Getenv("AUTH_SERVICE_URL")
	usersAddr := os.Getenv("USERS_SERVICE_URL")
	ordersAddr := os.Getenv("ORDERS_SERVICE_URL")
	searchAddr := os.Getenv("SEARCH_SERVICE_URL")
	mediaAddr := os.Getenv("MEDIA_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/auth", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", authAddr+"/v1/auth/token", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":"auth"}`)
	})
	mux.HandleFunc("GET /api/v1/users", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", usersAddr+"/v1/users", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":"users"}`)
	})
	mux.HandleFunc("POST /api/v1/orders", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", ordersAddr+"/v1/orders", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":"orders"}`)
	})
	mux.HandleFunc("GET /api/v1/search", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", searchAddr+"/v1/search", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":"search"}`)
	})
	mux.HandleFunc("GET /api/v1/media", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", mediaAddr+"/v1/media", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"routed":"media"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
