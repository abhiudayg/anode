package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"hash/fnv"
	"io"
	"log"
	"net/http"
	"os"
)

type indexRequest struct {
	SKU    string    `json:"sku"`
	Name   string    `json:"name"`
	Vector []float64 `json:"vector"`
}

type searchRequest struct {
	Vector []float64 `json:"vector"`
	Limit  int       `json:"limit"`
}

const collection = "products"

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/index", func(w http.ResponseWriter, r *http.Request) {
		var req indexRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.SKU == "" || len(req.Vector) == 0 {
			http.Error(w, "invalid index request", http.StatusBadRequest)
			return
		}
		point := map[string]any{
			"points": []map[string]any{{
				"id":      pointID(req.SKU),
				"vector":  req.Vector,
				"payload": map[string]string{"sku": req.SKU, "name": req.Name},
			}},
		}
		if err := qdrant(r, http.MethodPut, "/collections/"+collection+"/points?wait=true", point, nil); err != nil {
			http.Error(w, "index failed", http.StatusBadGateway)
			return
		}
		w.WriteHeader(http.StatusAccepted)
	})
	mux.HandleFunc("POST /v1/search", func(w http.ResponseWriter, r *http.Request) {
		var req searchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.Vector) == 0 {
			http.Error(w, "invalid search request", http.StatusBadRequest)
			return
		}
		if req.Limit <= 0 || req.Limit > 50 {
			req.Limit = 10
		}
		var out json.RawMessage
		if err := qdrant(r, http.MethodPost, "/collections/"+collection+"/points/search",
			map[string]any{"vector": req.Vector, "limit": req.Limit, "with_payload": true}, &out); err != nil {
			http.Error(w, "search failed", http.StatusBadGateway)
			return
		}
		_, _ = w.Write(out)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9025"), mux))
}

func pointID(sku string) uint64 {
	h := fnv.New64a()
	_, _ = h.Write([]byte(sku))
	return h.Sum64()
}

func qdrant(r *http.Request, method, path string, body any, out *json.RawMessage) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(r.Context(), method, os.Getenv("SEARCH_QDRANT_URL")+path, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return errors.New("qdrant error")
	}
	if out != nil {
		raw, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		*out = raw
	}
	return nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
