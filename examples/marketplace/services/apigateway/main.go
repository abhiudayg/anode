package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

func main() {
	mux := http.NewServeMux()
	mux.Handle("/v1/auth/", proxyTo(os.Getenv("AUTH_SERVICE_URL")))
	mux.Handle("/v1/users/", proxyTo(os.Getenv("USERS_SERVICE_URL")))
	mux.Handle("/v1/orders", proxyTo(os.Getenv("ORDERS_SERVICE_URL")))
	mux.Handle("/v1/media/", proxyTo(os.Getenv("MEDIA_SERVICE_URL")))
	mux.Handle("/v1/search", proxyTo(os.Getenv("SEARCH_SERVICE_URL")))
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok\n"))
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9003"), mux))
}

func proxyTo(target string) http.Handler {
	u, err := url.Parse(target)
	if err != nil {
		log.Fatalf("bad upstream %q: %v", target, err)
	}
	return httputil.NewSingleHostReverseProxy(u)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
