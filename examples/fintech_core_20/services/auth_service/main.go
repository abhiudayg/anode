package main

import (
	"encoding/json"
	"log"
	"net/http"

	"fintech_core_20/services/auth_service/auth"
)

func main() {
	cfg := auth.LoadConfig()
	mgr := auth.NewSessionManager(cfg)
	defer mgr.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/auth/token", func(w http.ResponseWriter, r *http.Request) {
		token, err := mgr.CreateSession(r.Context(), "user_9921")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_, _ = mgr.VerifyWithAccounts(r.Context(), "user_9921")

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"access_token": token,
			"token_type":   "Bearer",
		})
	})

	log.Printf("[auth_service] Listening on :%s", cfg.Port)
	_ = http.ListenAndServe(":"+cfg.Port, mux)
}
