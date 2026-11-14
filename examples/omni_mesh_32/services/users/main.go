package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type user struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("USERS_POSTGRES_DSN"))
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/users", func(w http.ResponseWriter, r *http.Request) {
		var c credentials
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.Email == "" || len(c.Password) < 8 {
			http.Error(w, "invalid user", http.StatusBadRequest)
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(c.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "hash failed", http.StatusInternalServerError)
			return
		}
		id, err := newID()
		if err != nil {
			http.Error(w, "id generation failed", http.StatusInternalServerError)
			return
		}
		u := user{ID: id, Email: strings.ToLower(c.Email), Name: c.Name}
		if _, err := pool.Exec(r.Context(),
			`INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)`,
			u.ID, u.Email, u.Name, string(hash)); err != nil {
			http.Error(w, "write failed", http.StatusConflict)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(u)
	})
	mux.HandleFunc("POST /v1/users/verify", func(w http.ResponseWriter, r *http.Request) {
		var c credentials
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		var u user
		var hash string
		err := pool.QueryRow(r.Context(),
			`SELECT id, email, name, password_hash FROM users WHERE email = $1`, strings.ToLower(c.Email)).
			Scan(&u.ID, &u.Email, &u.Name, &hash)
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		if bcrypt.CompareHashAndPassword([]byte(hash), []byte(c.Password)) != nil {
			http.Error(w, "invalid credentials", http.StatusUnauthorized)
			return
		}
		_ = json.NewEncoder(w).Encode(u)
	})
	mux.HandleFunc("GET /v1/users/{id}", func(w http.ResponseWriter, r *http.Request) {
		var u user
		err := pool.QueryRow(r.Context(),
			`SELECT id, email, name FROM users WHERE id = $1`, r.PathValue("id")).Scan(&u.ID, &u.Email, &u.Name)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(u)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9029"), mux))
}

func newID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
