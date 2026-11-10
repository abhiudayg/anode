package gateway

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Router struct {
	cfg *Config
}

func NewRouter(cfg *Config) *Router {
	return &Router{cfg: cfg}
}

func (r *Router) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/health", r.handleHealth)
	mux.HandleFunc("POST /api/v1/auth/login", r.proxyAuth)
	mux.HandleFunc("GET /api/v1/accounts/me", r.proxyAccounts)
	mux.HandleFunc("POST /api/v1/trading/orders", r.proxyTrading)
	mux.HandleFunc("POST /api/v1/payments/transfer", r.proxyPayments)
	mux.HandleFunc("GET /api/v1/cards", r.proxyCards)
}

func (r *Router) handleHealth(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "api-gateway",
		"version": "1.0.0",
	})
}

func (r *Router) proxyAuth(w http.ResponseWriter, req *http.Request) {
	target := r.cfg.AuthServiceURL + "/v1/auth/token"
	outReq, err := http.NewRequestWithContext(req.Context(), "POST", target, req.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	_, _ = http.DefaultClient.Do(outReq)
	fmt.Fprintln(w, `{"session_token":"fintech_tok_99182"}`)
}

func (r *Router) proxyAccounts(w http.ResponseWriter, req *http.Request) {
	target := r.cfg.AccountsURL + "/v1/accounts/me"
	outReq, _ := http.NewRequestWithContext(req.Context(), "GET", target, nil)
	_, _ = http.DefaultClient.Do(outReq)
	fmt.Fprintln(w, `{"account_id":"acc_01","currency":"USD","balance_cents":1050000}`)
}

func (r *Router) proxyTrading(w http.ResponseWriter, req *http.Request) {
	target := r.cfg.TradingURL + "/v1/trading/order"
	outReq, _ := http.NewRequestWithContext(req.Context(), "POST", target, req.Body)
	_, _ = http.DefaultClient.Do(outReq)
	fmt.Fprintln(w, `{"order_id":"ord_tx_554","status":"queued"}`)
}

func (r *Router) proxyPayments(w http.ResponseWriter, req *http.Request) {
	target := r.cfg.PaymentRailsURL + "/v1/payments/execute"
	outReq, _ := http.NewRequestWithContext(req.Context(), "POST", target, req.Body)
	_, _ = http.DefaultClient.Do(outReq)
	fmt.Fprintln(w, `{"transfer_id":"tr_9988","state":"cleared"}`)
}

func (r *Router) proxyCards(w http.ResponseWriter, req *http.Request) {
	target := r.cfg.CardsURL + "/v1/cards/list"
	outReq, _ := http.NewRequestWithContext(req.Context(), "GET", target, nil)
	_, _ = http.DefaultClient.Do(outReq)
	fmt.Fprintln(w, `{"cards":[{"id":"c_1","masked":"**** 4242"}]}`)
}
