package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9001"
	}

	redisAddr := os.Getenv("AUTH_REDIS_ADDR")
	jwtSecret := os.Getenv("JWT_SIGNING_SECRET_KEY")
	usersAddr := os.Getenv("USERS_SERVICE_URL")

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/auth/token", func(w http.ResponseWriter, r *http.Request) {
		_ = jwtSecret
		req, _ := http.NewRequestWithContext(r.Context(), "GET", usersAddr+"/v1/users/lookup", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"token":"jwt.mock.token"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
