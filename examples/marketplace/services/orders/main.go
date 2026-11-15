package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type order struct {
	ID         string `json:"id"`
	CustomerID string `json:"customer_id"`
	SKU        string `json:"sku"`
	Quantity   int    `json:"quantity"`
	AmountCent int64  `json:"amount_cents"`
	Status     string `json:"status"`
}

func main() {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, os.Getenv("ORDERS_POSTGRES_DSN"))
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer pool.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		var o order
		if err := json.NewDecoder(r.Body).Decode(&o); err != nil || o.ID == "" || o.Quantity <= 0 {
			http.Error(w, "invalid order", http.StatusBadRequest)
			return
		}
		if status, err := reserveStock(r.Context(), o); err != nil {
			http.Error(w, "stock unavailable", status)
			return
		}
		o.Status = "payment_pending"
		if err := saveOrder(r.Context(), pool, o); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		if err := charge(r.Context(), o); err != nil {
			o.Status = "payment_failed"
			_ = saveOrder(r.Context(), pool, o)
			http.Error(w, "payment declined", http.StatusPaymentRequired)
			return
		}
		o.Status = "paid"
		_ = saveOrder(r.Context(), pool, o)
		postLedger(o)
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(o)
	})
	mux.HandleFunc("GET /v1/orders/{id}", func(w http.ResponseWriter, r *http.Request) {
		var o order
		err := pool.QueryRow(r.Context(),
			`SELECT id, customer_id, sku, quantity, amount_cents, status FROM orders WHERE id = $1`,
			r.PathValue("id")).Scan(&o.ID, &o.CustomerID, &o.SKU, &o.Quantity, &o.AmountCent, &o.Status)
		if errors.Is(err, pgx.ErrNoRows) {
			http.NotFound(w, r)
			return
		}
		if err != nil {
			http.Error(w, "read failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(o)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9020"), mux))
}

func saveOrder(ctx context.Context, pool *pgxpool.Pool, o order) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO orders (id, customer_id, sku, quantity, amount_cents, status, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, now())
		 ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
		o.ID, o.CustomerID, o.SKU, o.Quantity, o.AmountCent, o.Status)
	return err
}

func reserveStock(ctx context.Context, o order) (int, error) {
	body, _ := json.Marshal(map[string]any{"sku": o.SKU, "quantity": o.Quantity})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, os.Getenv("INVENTORY_SERVICE_URL")+"/v1/inventory/reserve", bytes.NewReader(body))
	if err != nil {
		return http.StatusInternalServerError, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return http.StatusBadGateway, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		return http.StatusConflict, errors.New("reservation rejected")
	}
	return http.StatusCreated, nil
}

func charge(ctx context.Context, o order) error {
	body, _ := json.Marshal(map[string]any{"order_id": o.ID, "amount_cents": o.AmountCent})
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, os.Getenv("PAYMENTS_SERVICE_URL")+"/v1/charges", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return errors.New("charge declined")
	}
	return nil
}

func postLedger(o order) {
	body, _ := json.Marshal(map[string]any{"account": "revenue", "amount_cents": o.AmountCent, "memo": "order " + o.ID})
	resp, err := http.Post(os.Getenv("ACCOUNTING_SERVICE_URL")+"/v1/ledger/entries", "application/json", bytes.NewReader(body))
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
