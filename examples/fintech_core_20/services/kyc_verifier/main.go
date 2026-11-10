package main

import (
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/kyc_verifier/handler"
	"fintech_core_20/services/kyc_verifier/persona"
	"fintech_core_20/services/kyc_verifier/vault"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8088"
	}

	v, err := vault.New()
	if err != nil {
		log.Fatalf("Vault error: %v", err)
	}
	defer v.Close()

	p := persona.New()
	h := handler.New(v, p)

	mux := http.NewServeMux()
	h.Register(mux)

	log.Printf("[kyc_verifier] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
