package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type page struct {
	Slug  string `json:"slug"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

const assetBucket = "cms-assets"

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("CMS_POSTGRES_DSN"))
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	objects, err := minio.New(os.Getenv("CMS_MINIO_ENDPOINT"), &minio.Options{
		Creds:  credentials.NewStaticV4(os.Getenv("CMS_MINIO_ACCESS_KEY"), os.Getenv("CMS_MINIO_SECRET_KEY"), ""),
		Secure: false,
	})
	if err != nil {
		log.Fatalf("minio: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/pages", func(w http.ResponseWriter, r *http.Request) {
		var p page
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil || p.Slug == "" {
			http.Error(w, "invalid page", http.StatusBadRequest)
			return
		}
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO pages (slug, title, body, updated_at) VALUES ($1, $2, $3, now())
			 ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()`,
			p.Slug, p.Title, p.Body); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("GET /v1/pages/{slug}", func(w http.ResponseWriter, r *http.Request) {
		var p page
		err := pool.QueryRow(r.Context(),
			`SELECT slug, title, body FROM pages WHERE slug = $1`, r.PathValue("slug")).
			Scan(&p.Slug, &p.Title, &p.Body)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(p)
	})
	mux.HandleFunc("PUT /v1/assets/{name}", func(w http.ResponseWriter, r *http.Request) {
		if _, err := objects.PutObject(r.Context(), assetBucket, r.PathValue("name"), r.Body, -1,
			minio.PutObjectOptions{ContentType: r.Header.Get("Content-Type")}); err != nil {
			http.Error(w, "upload failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9007"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
