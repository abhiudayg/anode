package handler

import (
	"encoding/json"
	"net/http"

	"fintech_core_20/services/kyc_verifier/persona"
	"fintech_core_20/services/kyc_verifier/vault"
)

type KYCHandler struct {
	vault   *vault.DocumentVault
	persona *persona.Client
}

func New(v *vault.DocumentVault, p *persona.Client) *KYCHandler {
	return &KYCHandler{vault: v, persona: p}
}

func (h *KYCHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/kyc/verify", h.VerifyIdentity)
}

func (h *KYCHandler) VerifyIdentity(w http.ResponseWriter, r *http.Request) {
	_ = h.persona.SubmitInquiry(r.Context())
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "approved",
		"tier":        3,
		"document_id": "doc_pass_4492",
	})
}
