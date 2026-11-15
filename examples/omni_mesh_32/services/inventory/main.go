package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"
)

type reservation struct {
	SKU      string `json:"sku"`
	Quantity int    `json:"quantity"`
}

func main() {
	db, err := sql.Open("mysql", os.Getenv("INVENTORY_MARIADB_DSN"))
	if err != nil {
		log.Fatalf("mariadb: %v", err)
	}
	defer db.Close()

	locks := redis.NewClient(&redis.Options{Addr: os.Getenv("INVENTORY_LOCKS_REDIS_ADDR")})
	defer locks.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/inventory/reserve", func(w http.ResponseWriter, r *http.Request) {
		var res reservation
		if err := json.NewDecoder(r.Body).Decode(&res); err != nil || res.SKU == "" || res.Quantity <= 0 {
			http.Error(w, "invalid reservation", http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		lockKey := "lock:sku:" + res.SKU
		locked, err := locks.SetNX(ctx, lockKey, "1", 5*time.Second).Result()
		if err != nil || !locked {
			http.Error(w, "sku busy", http.StatusConflict)
			return
		}
		defer locks.Del(context.Background(), lockKey)

		if err := reserve(ctx, db, res); err != nil {
			status := http.StatusInternalServerError
			if errors.Is(err, errOutOfStock) {
				status = http.StatusConflict
			}
			http.Error(w, err.Error(), status)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9014"), mux))
}

var errOutOfStock = errors.New("out of stock")

func reserve(ctx context.Context, db *sql.DB, res reservation) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		`UPDATE stock SET on_hand = on_hand - ? WHERE sku = ? AND on_hand >= ?`,
		res.Quantity, res.SKU, res.Quantity)
	if err != nil {
		return err
	}
	if n, _ := result.RowsAffected(); n == 0 {
		return errOutOfStock
	}
	return tx.Commit()
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
