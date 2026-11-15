package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type qdrantSearch struct {
	Vector []float64 `json:"vector"`
	Limit  int       `json:"limit"`
}

func main() {
	cache := redis.NewClient(&redis.Options{Addr: os.Getenv("RECS_REDIS_ADDR")})
	defer cache.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /v1/recommendations/{user}", func(w http.ResponseWriter, r *http.Request) {
		user := r.PathValue("user")
		key := "recs:" + user
		if cached, err := cache.Get(r.Context(), key).Result(); err == nil {
			_, _ = io.WriteString(w, cached)
			return
		}
		vector, err := parseVector(r.URL.Query().Get("vector"))
		if err != nil {
			http.Error(w, "vector must be comma-separated numbers", http.StatusBadRequest)
			return
		}
		body, err := searchQdrant(r, vector)
		if err != nil {
			http.Error(w, "vector store unavailable", http.StatusBadGateway)
			return
		}
		cache.Set(r.Context(), key, body, 10*time.Minute)
		_, _ = w.Write(body)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9023"), mux))
}

func parseVector(raw string) ([]float64, error) {
	if raw == "" {
		return nil, errors.New("empty vector")
	}
	parts := strings.Split(raw, ",")
	out := make([]float64, 0, len(parts))
	for _, p := range parts {
		f, err := strconv.ParseFloat(strings.TrimSpace(p), 64)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func searchQdrant(r *http.Request, vector []float64) ([]byte, error) {
	body, _ := json.Marshal(qdrantSearch{Vector: vector, Limit: 10})
	url := os.Getenv("RECS_QDRANT_URL") + "/collections/products/points/search"
	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("qdrant search failed")
	}
	return io.ReadAll(resp.Body)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
