package handler

import (
	"encoding/json"
	"net/http"

	"fintech_core_20/services/trading_engine/events"
	"fintech_core_20/services/trading_engine/orderbook"
)

type OrderHandler struct {
	cache *orderbook.Cache
	bus   *events.EventBus
}

func New(cache *orderbook.Cache, bus *events.EventBus) *OrderHandler {
	return &OrderHandler{cache: cache, bus: bus}
}

func (h *OrderHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/trading/order", h.PlaceOrder)
	mux.HandleFunc("GET /v1/trading/depth", h.GetDepth)
}

func (h *OrderHandler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"order_id": "ord_99018",
		"status":   "matched",
		"price":    98500.50,
	})
}

func (h *OrderHandler) GetDepth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"bids": []float64{98500.0, 98495.0},
		"asks": []float64{98505.0, 98510.0},
	})
}
