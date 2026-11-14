package main

import (
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

type review struct {
	SKU     string    `json:"sku" bson:"sku"`
	Author  string    `json:"author" bson:"author"`
	Stars   int       `json:"stars" bson:"stars"`
	Text    string    `json:"text" bson:"text"`
	Created time.Time `json:"created_at" bson:"created_at"`
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	client, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("REVIEWS_MONGO_URI")))
	if err != nil {
		log.Fatalf("mongo: %v", err)
	}
	defer client.Disconnect(ctx)
	reviews := client.Database("reviews").Collection("reviews")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/reviews", func(w http.ResponseWriter, r *http.Request) {
		var rv review
		if err := json.NewDecoder(r.Body).Decode(&rv); err != nil || rv.SKU == "" || rv.Stars < 1 || rv.Stars > 5 {
			http.Error(w, "invalid review", http.StatusBadRequest)
			return
		}
		rv.Created = time.Now().UTC()
		if _, err := reviews.InsertOne(r.Context(), rv); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/reviews", func(w http.ResponseWriter, r *http.Request) {
		sku := r.URL.Query().Get("sku")
		if sku == "" {
			http.Error(w, "sku is required", http.StatusBadRequest)
			return
		}
		cur, err := reviews.Find(r.Context(), bson.M{"sku": sku},
			options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(20))
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		var out []review
		if err := cur.All(r.Context(), &out); err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(out)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9024"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
