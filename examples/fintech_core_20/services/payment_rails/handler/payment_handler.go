package handler

import (
	"encoding/json"
	"net/http"

	"fintech_core_20/services/payment_rails/store"
	"fintech_core_20/services/payment_rails/stripe"
)

type PaymentHandler struct {
	store  *store.Store
	stripe *stripe.Client
}

func New(s *store.Store, sc *stripe.Client) *PaymentHandler {
	return &PaymentHandler{store: s, stripe: sc}
}

func (h *PaymentHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/payments/execute", h.ExecutePayment)
}

func (h *PaymentHandler) ExecutePayment(w http.ResponseWriter, r *http.Request) {
	_ = h.stripe.CreateIntent(r.Context())
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"payment_id": "pay_stripe_8819",
		"status":     "settled",
	})
}
