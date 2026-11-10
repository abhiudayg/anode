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
		port = "9031"
	}

	redisAddr := os.Getenv("LIVECHAT_REDIS_ADDR")
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/chat/ws", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"ws_handshake":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
