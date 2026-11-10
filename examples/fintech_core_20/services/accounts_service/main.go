package main

import (
	"log"
	"net/http"

	"fintech_core_20/services/accounts_service/config"
	"fintech_core_20/services/accounts_service/handler"
	"fintech_core_20/services/accounts_service/repository"
)

func main() {
	cfg := config.Load()
	repo, err := repository.NewAccountRepository(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize repo: %v", err)
	}
	defer repo.Close()

	h := handler.NewAccountHandler(repo)
	mux := http.NewServeMux()
	h.Register(mux)

	log.Printf("[accounts_service] Listening on :%s", cfg.Port)
	_ = http.ListenAndServe(":"+cfg.Port, mux)
}
