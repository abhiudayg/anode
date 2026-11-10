package handler

import (
	"encoding/json"
	"net/http"

	"fintech_core_20/services/accounts_service/repository"
)

type AccountHandler struct {
	repo *repository.AccountRepository
}

func NewAccountHandler(repo *repository.AccountRepository) *AccountHandler {
	return &AccountHandler{repo: repo}
}

func (h *AccountHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /v1/accounts/me", h.GetMyAccount)
	mux.HandleFunc("GET /v1/accounts/verify/{id}", h.VerifyAccount)
}

func (h *AccountHandler) GetMyAccount(w http.ResponseWriter, r *http.Request) {
	acc, err := h.repo.FindByID(r.Context(), "acc_primary_1")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(acc)
}

func (h *AccountHandler) VerifyAccount(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"verified": true})
}
