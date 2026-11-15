package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type document struct {
	ID          string    `json:"id" bson:"_id"`
	Title       string    `json:"title" bson:"title"`
	ContentType string    `json:"content_type" bson:"content_type"`
	UploadedAt  time.Time `json:"uploaded_at" bson:"uploaded_at"`
}

const docBucket = "documents"

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	mongoClient, err := mongo.Connect(options.Client().ApplyURI(os.Getenv("DOCUMENTS_MONGO_URI")))
	if err != nil {
		log.Fatalf("mongo: %v", err)
	}
	defer mongoClient.Disconnect(ctx)
	meta := mongoClient.Database("documents").Collection("metadata")

	objects, err := minio.New(os.Getenv("DOCUMENTS_MINIO_ENDPOINT"), &minio.Options{
		Creds:  credentials.NewStaticV4(os.Getenv("DOCUMENTS_MINIO_ACCESS_KEY"), os.Getenv("DOCUMENTS_MINIO_SECRET_KEY"), ""),
		Secure: false,
	})
	if err != nil {
		log.Fatalf("minio: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("PUT /v1/documents/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		contentType := r.Header.Get("Content-Type")
		if _, err := objects.PutObject(r.Context(), docBucket, id, r.Body, -1,
			minio.PutObjectOptions{ContentType: contentType}); err != nil {
			http.Error(w, "upload failed", http.StatusInternalServerError)
			return
		}
		doc := document{ID: id, Title: r.URL.Query().Get("title"), ContentType: contentType, UploadedAt: time.Now().UTC()}
		if _, err := meta.InsertOne(r.Context(), doc); err != nil {
			http.Error(w, "metadata write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/documents/{id}", func(w http.ResponseWriter, r *http.Request) {
		var doc document
		if err := meta.FindOne(r.Context(), bson.M{"_id": r.PathValue("id")}).Decode(&doc); err != nil {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(doc)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9011"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
