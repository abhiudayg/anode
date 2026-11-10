package handler

import (
	"encoding/json"
	"net/http"

	"fintech_core_20/services/compliance_audit/store"
)

type AuditHandler struct {
	store *store.ClickhouseAudit
}

func New(s *store.ClickhouseAudit) *AuditHandler {
	return &AuditHandler{store: s}
}

func (h *AuditHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/compliance/log", h.LogEvent)
}

func (h *AuditHandler) LogEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]bool{"logged": true})
}
