package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gocql/gocql"
)

type chargeRequest struct {
	OrderID     string `json:"order_id"`
	AmountCents int64  `json:"amount_cents"`
}

type hold struct {
	OrderID string `json:"order_id"`
	Reason  string `json:"reason"`
}

func main() {
	cluster := gocql.NewCluster(strings.Split(os.Getenv("PAYMENTS_SCYLLA_HOSTS"), ",")...)
	cluster.Keyspace = envOr("PAYMENTS_SCYLLA_KEYSPACE", "payments")
	cluster.Consistency = gocql.Quorum
	session, err := cluster.CreateSession()
	if err != nil {
		log.Fatalf("scylla: %v", err)
	}
	defer session.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/charges", func(w http.ResponseWriter, r *http.Request) {
		var c chargeRequest
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil || c.OrderID == "" || c.AmountCents <= 0 {
			http.Error(w, "invalid charge", http.StatusBadRequest)
			return
		}
		chargeID, err := createStripeCharge(r.Context(), c)
		if err != nil {
			http.Error(w, "charge declined", http.StatusPaymentRequired)
			return
		}
		if err := session.Query(
			`INSERT INTO charges (order_id, charge_id, amount_cents, created_at) VALUES (?, ?, ?, ?)`,
			c.OrderID, chargeID, c.AmountCents, time.Now().UTC()).WithContext(r.Context()).Exec(); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"charge_id": chargeID})
	})
	mux.HandleFunc("POST /v1/payments/hold", func(w http.ResponseWriter, r *http.Request) {
		var h hold
		if err := json.NewDecoder(r.Body).Decode(&h); err != nil || h.OrderID == "" {
			http.Error(w, "invalid hold", http.StatusBadRequest)
			return
		}
		if err := session.Query(
			`INSERT INTO holds (order_id, reason, created_at) VALUES (?, ?, ?)`,
			h.OrderID, h.Reason, time.Now().UTC()).WithContext(r.Context()).Exec(); err != nil {
			http.Error(w, "write failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9021"), mux))
}

func createStripeCharge(ctx context.Context, c chargeRequest) (string, error) {
	form := url.Values{}
	form.Set("amount", strconv.FormatInt(c.AmountCents, 10))
	form.Set("currency", "usd")
	form.Set("description", "order "+c.OrderID)
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.stripe.com/v1/charges",
		bytes.NewBufferString(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(os.Getenv("STRIPE_SECRET_KEY"), "")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", errStripe
	}
	var out struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return out.ID, nil
}

var errStripe = errors.New("stripe rejected the charge")

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
