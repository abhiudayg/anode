package main

import (
	"log"
	"net/http"

	"fintech_core_20/services/api_gateway/gateway"
)

func main() {
	cfg := gateway.LoadConfig()
	router := gateway.NewRouter(cfg)

	mux := http.NewServeMux()
	router.RegisterRoutes(mux)

	log.Printf("[api_gateway] Starting fintech reverse proxy on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
