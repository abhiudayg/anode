package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

type chatMessage struct {
	Room   string `json:"room"`
	Author string `json:"author"`
	Text   string `json:"text"`
}

const historyLimit = 100

func main() {
	rdb := redis.NewClient(&redis.Options{Addr: os.Getenv("LIVECHAT_REDIS_ADDR"), Password: os.Getenv("LIVECHAT_REDIS_PASSWORD")})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/livechat/rooms/{room}/messages", func(w http.ResponseWriter, r *http.Request) {
		var m chatMessage
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil || m.Text == "" {
			http.Error(w, "invalid message", http.StatusBadRequest)
			return
		}
		m.Room = r.PathValue("room")
		payload, _ := json.Marshal(m)
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		key := "history:" + m.Room
		pipe := rdb.TxPipeline()
		pipe.RPush(ctx, key, payload)
		pipe.LTrim(ctx, key, -historyLimit, -1)
		pipe.Publish(ctx, "chat:"+m.Room, payload)
		if _, err := pipe.Exec(ctx); err != nil {
			http.Error(w, "chat backend unavailable", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusAccepted)
	})
	mux.HandleFunc("GET /v1/livechat/rooms/{room}/history", func(w http.ResponseWriter, r *http.Request) {
		raw, err := rdb.LRange(r.Context(), "history:"+r.PathValue("room"), 0, -1).Result()
		if err != nil {
			http.Error(w, "chat backend unavailable", http.StatusServiceUnavailable)
			return
		}
		out := make([]chatMessage, 0, len(raw))
		for _, s := range raw {
			var m chatMessage
			if json.Unmarshal([]byte(s), &m) == nil {
				out = append(out, m)
			}
		}
		_ = json.NewEncoder(w).Encode(out)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9015"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
