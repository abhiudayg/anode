package main

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type item struct {
	SKU   string `json:"sku" bson:"sku"`
	Name  string `json:"name" bson:"name"`
	Price int64  `json:"price_cents" bson:"price_cents"`
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("CATALOG_MONGO_URI")))
	if err != nil {
		log.Fatalf("mongo: %v", err)
	}
	defer client.Disconnect(ctx)
	items := client.Database("catalog").Collection("items")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/catalog/items", func(w http.ResponseWriter, r *http.Request) {
		var it item
		if err := json.NewDecoder(r.Body).Decode(&it); err != nil || it.SKU == "" {
			http.Error(w, "invalid item", http.StatusBadRequest)
			return
		}
		if _, err := items.InsertOne(r.Context(), it); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		indexForSearch(it)
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/catalog/items", func(w http.ResponseWriter, r *http.Request) {
		cur, err := items.Find(r.Context(), bson.M{}, options.Find().SetLimit(50))
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		var out []item
		if err := cur.All(r.Context(), &out); err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(out)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9006"), mux))
}

func indexForSearch(it item) {
	body, _ := json.Marshal(it)
	resp, err := http.Post(os.Getenv("SEARCH_SERVICE_URL")+"/v1/index", "application/json", bytes.NewReader(body))
	if err == nil {
		resp.Body.Close()
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
