package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func main() {
	rdb := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("AUTH_REDIS_ADDR"),
		Password: os.Getenv("AUTH_REDIS_PASSWORD"),
	})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		body, _ := json.Marshal(req)
		resp, err := http.Post(os.Getenv("USERS_SERVICE_URL")+"/v1/users/verify", "application/json", bytes.NewReader(body))
		if err != nil || resp.StatusCode != http.StatusOK {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		defer resp.Body.Close()

		token := newToken()
		if err := rdb.Set(r.Context(), "session:"+token, req.Email, 24*time.Hour).Err(); err != nil {
			http.Error(w, "session store unavailable", http.StatusServiceUnavailable)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"token": token})
	})
	mux.HandleFunc("GET /v1/auth/session/{token}", func(w http.ResponseWriter, r *http.Request) {
		email, err := rdb.Get(context.Background(), "session:"+r.PathValue("token")).Result()
		if err == redis.Nil {
			http.Error(w, "unknown session", http.StatusUnauthorized)
			return
		}
		if err != nil {
			http.Error(w, "session store unavailable", http.StatusServiceUnavailable)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"email": email})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9005"), mux))
}

func newToken() string {
	b := make([]byte, 24)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
