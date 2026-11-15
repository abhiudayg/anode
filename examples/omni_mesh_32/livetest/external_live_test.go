//go:build live

package livetest

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gocql/gocql"
	"github.com/jackc/pgx/v5/pgxpool"
	amqp "github.com/rabbitmq/amqp091-go"
	kafka "github.com/segmentio/kafka-go"
)

const kafkaBroker = "127.0.0.1:19092"

// recorded is one request that a provider stub received.
type recorded struct {
	Method string
	Path   string
	Query  string
	Auth   string
	Body   string
}

// providerStub is a local stand-in for an external API. The service is pointed at it through its base URL env var.
type providerStub struct {
	server *httptest.Server
	mu     sync.Mutex
	calls  []recorded
}

func newProviderStub(t *testing.T, status int, reply string) *providerStub {
	t.Helper()
	stub := &providerStub{}
	stub.server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		stub.mu.Lock()
		stub.calls = append(stub.calls, recorded{Method: r.Method, Path: r.URL.Path, Query: r.URL.RawQuery, Auth: r.Header.Get("Authorization"), Body: string(body)})
		stub.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		_, _ = io.WriteString(w, reply)
	}))
	t.Cleanup(stub.server.Close)
	return stub
}

func (s *providerStub) last(t *testing.T) recorded {
	t.Helper()
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.calls) == 0 {
		t.Fatal("the provider stub received no request")
	}
	return s.calls[len(s.calls)-1]
}

func openScylla(t *testing.T) *gocql.Session {
	t.Helper()
	admin := gocql.NewCluster(scyllaHost)
	admin.Port = scyllaPort
	admin.Timeout = 10 * time.Second
	var session *gocql.Session
	eventually(t, "scylladb", func() error {
		s, err := admin.CreateSession()
		if err != nil {
			return err
		}
		session = s
		return nil
	})
	if err := session.Query(fmt.Sprintf(
		"CREATE KEYSPACE IF NOT EXISTS %s WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}", scyllaSpace)).Exec(); err != nil {
		t.Fatalf("create keyspace: %v", err)
	}
	session.Close()
	ks := gocql.NewCluster(scyllaHost)
	ks.Port = scyllaPort
	ks.Keyspace = scyllaSpace
	keyed, err := ks.CreateSession()
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(keyed.Close)
	return keyed
}

func TestNotificationsSendThroughSendGridStub(t *testing.T) {
	waitRabbit(t)
	sendgrid := newProviderStub(t, http.StatusAccepted, "")
	notifications := startService(t, "notifications", map[string]string{
		"NOTIFICATIONS_RABBITMQ_URL": rabbitURL,
		"SENDGRID_API_URL":           sendgrid.server.URL,
		"SENDGRID_API_KEY":           "live-key",
		"NOTIFICATIONS_FROM_EMAIL":   "no-reply@example.test",
	})
	email := "customer-" + uniq() + "@example.test"
	status, body := postJSON(t, http.MethodPost, notifications+"/v1/notifications",
		map[string]string{"user_id": "u-1", "email": email, "subject": "Order paid", "body": "Thanks"})
	requireStatus(t, status, http.StatusAccepted, body)

	got := sendgrid.last(t)
	if got.Method != http.MethodPost || got.Path != "/v3/mail/send" {
		t.Fatalf("sendgrid request = %s %s, want POST /v3/mail/send", got.Method, got.Path)
	}
	if got.Auth != "Bearer live-key" {
		t.Fatalf("authorization = %q, want the SendGrid key", got.Auth)
	}
	if !strings.Contains(got.Body, email) {
		t.Fatalf("sendgrid body does not name the recipient: %s", got.Body)
	}
}

func TestCRMCreatesContactInSalesforceStub(t *testing.T) {
	salesforce := newProviderStub(t, http.StatusCreated, `{"id":"003live"}`)
	crm := startService(t, "crm", map[string]string{
		"SALESFORCE_API_URL":      salesforce.server.URL,
		"SALESFORCE_ACCESS_TOKEN": "live-token",
	})
	email := "lead-" + uniq() + "@example.test"
	status, body := postJSON(t, http.MethodPost, crm+"/v1/crm/contacts",
		map[string]string{"first_name": "Ada", "last_name": "Lovelace", "email": email})
	requireStatus(t, status, http.StatusCreated, body)
	if !strings.Contains(string(body), "003live") {
		t.Fatalf("crm did not return the Salesforce id: %s", body)
	}

	got := salesforce.last(t)
	if got.Path != "/services/data/v58.0/sobjects/Contact" {
		t.Fatalf("salesforce path = %s", got.Path)
	}
	if got.Auth != "Bearer live-token" {
		t.Fatalf("authorization = %q", got.Auth)
	}
	if !strings.Contains(got.Body, email) {
		t.Fatalf("salesforce body does not contain the contact: %s", got.Body)
	}
}

func TestTaxRatesFromAvalaraStub(t *testing.T) {
	avalara := newProviderStub(t, http.StatusOK, `{"totalRate":0.0875}`)
	tax := startService(t, "tax", map[string]string{
		"AVALARA_API_URL":     avalara.server.URL,
		"AVALARA_ACCOUNT_ID":  "123",
		"AVALARA_LICENSE_KEY": "live-license",
	})
	status, body := postJSON(t, http.MethodGet, tax+"/v1/tax/rates?postal_code=94105", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), "0.0875") {
		t.Fatalf("tax response = %s, want the Avalara rate", body)
	}

	got := avalara.last(t)
	if got.Path != "/api/v2/tax/rates" || got.Query != "postalCode=94105" {
		t.Fatalf("avalara request = %s?%s", got.Path, got.Query)
	}
	if got.Auth == "" {
		t.Fatalf("avalara request has no basic auth")
	}
}

func TestPaymentsChargesThroughStripeStubAndStoresInScylla(t *testing.T) {
	session := openScylla(t)
	applyCQLFiles(t, filepath.Join(migrationsDir(t), "payments"), session)

	stripe := newProviderStub(t, http.StatusOK, `{"id":"ch_live_1"}`)
	payments := startService(t, "payments", map[string]string{
		"STRIPE_API_URL":           stripe.server.URL,
		"STRIPE_SECRET_KEY":        "placeholder-stripe-secret",
		"PAYMENTS_SCYLLA_HOSTS":    scyllaHost,
		"PAYMENTS_SCYLLA_KEYSPACE": scyllaSpace,
	})
	order := "order-" + uniq()
	status, body := postJSON(t, http.MethodPost, payments+"/v1/charges", map[string]any{"order_id": order, "amount_cents": 1500})
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), "ch_live_1") {
		t.Fatalf("payments did not return the Stripe charge: %s", body)
	}

	got := stripe.last(t)
	if got.Path != "/v1/charges" || got.Auth == "" {
		t.Fatalf("stripe request = %s, auth %q", got.Path, got.Auth)
	}
	if !strings.Contains(got.Body, "amount=1500") {
		t.Fatalf("stripe body = %s, want amount=1500", got.Body)
	}

	var charge string
	if err := session.Query("SELECT charge_id FROM charges WHERE order_id = ?", order).Scan(&charge); err != nil {
		t.Fatalf("read the charge back from scylla: %v", err)
	}
	if charge != "ch_live_1" {
		t.Fatalf("stored charge = %q, want ch_live_1", charge)
	}
}

func TestShippingCreatesEasyPostShipmentAndPublishesToKafka(t *testing.T) {
	ensureKafkaTopic(t, "shipments.created")
	easypost := newProviderStub(t, http.StatusCreated, `{"id":"shp_live_1"}`)
	shipping := startService(t, "shipping", map[string]string{
		"EASYPOST_API_URL":       easypost.server.URL,
		"EASYPOST_API_KEY":       "live-key",
		"SHIPPING_KAFKA_BROKERS": kafkaBroker,
	})
	order := "order-" + uniq()
	status, body := postJSON(t, http.MethodPost, shipping+"/v1/shipments",
		map[string]any{"order_id": order, "to_zip": "94105", "from_zip": "10001", "weight_ounces": 16})
	requireStatus(t, status, http.StatusCreated, body)
	if !strings.Contains(string(body), "shp_live_1") {
		t.Fatalf("shipping did not return the EasyPost id: %s", body)
	}
	if got := easypost.last(t); got.Path != "/v2/shipments" {
		t.Fatalf("easypost path = %s", got.Path)
	}

	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{kafkaBroker},
		Topic:     "shipments.created",
		Partition: 0,
		MinBytes:  1,
		MaxBytes:  1 << 20,
	})
	defer reader.Close()
	if err := reader.SetOffset(kafka.FirstOffset); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	for {
		msg, err := reader.ReadMessage(ctx)
		if err != nil {
			t.Fatalf("no shipment event on shipments.created: %v", err)
		}
		if string(msg.Key) == order {
			if !strings.Contains(string(msg.Value), "shp_live_1") {
				t.Fatalf("event = %s, want the tracking id", msg.Value)
			}
			return
		}
	}
}

func TestOrdersCheckoutRunsTheWholeChain(t *testing.T) {
	migratePostgres(t)
	migrateMaria(t)
	session := openScylla(t)
	applyCQLFiles(t, filepath.Join(migrationsDir(t), "payments"), session)
	migrateTimescale(t)

	sku := "sku-" + uniq()
	maria := openMaria(t)
	if _, err := maria.Exec("INSERT INTO stock (sku, on_hand) VALUES (?, 4)", sku); err != nil {
		t.Fatalf("seed stock: %v", err)
	}

	stripe := newProviderStub(t, http.StatusOK, `{"id":"ch_order_1"}`)
	inventory := startService(t, "inventory", map[string]string{
		"INVENTORY_MARIADB_DSN":      mariaDSN,
		"INVENTORY_LOCKS_REDIS_ADDR": redisAddr,
	})
	payments := startService(t, "payments", map[string]string{
		"STRIPE_API_URL":           stripe.server.URL,
		"STRIPE_SECRET_KEY":        "placeholder-stripe-secret",
		"PAYMENTS_SCYLLA_HOSTS":    scyllaHost,
		"PAYMENTS_SCYLLA_KEYSPACE": scyllaSpace,
	})
	accounting := startService(t, "accounting", map[string]string{"ACCOUNTING_TIMESCALE_DSN": timescaleDSN})
	orders := startService(t, "orders", map[string]string{
		"ORDERS_POSTGRES_DSN":    pgDSN,
		"INVENTORY_SERVICE_URL":  inventory,
		"PAYMENTS_SERVICE_URL":   payments,
		"ACCOUNTING_SERVICE_URL": accounting,
	})

	id := "ord-" + uniq()
	status, body := postJSON(t, http.MethodPost, orders+"/v1/orders", map[string]any{
		"id": id, "customer_id": "c-1", "sku": sku, "quantity": 1, "amount_cents": 1500,
	})
	requireStatus(t, status, http.StatusCreated, body)
	if !strings.Contains(string(body), `"status":"paid"`) {
		t.Fatalf("order response = %s, want status paid", body)
	}

	pool := openPostgres(t)
	var status2 string
	if err := pool.QueryRow(context.Background(), "SELECT status FROM orders WHERE id = $1", id).Scan(&status2); err != nil {
		t.Fatalf("read order back: %v", err)
	}
	if status2 != "paid" {
		t.Fatalf("stored order status = %s, want paid", status2)
	}
	var onHand int
	if err := maria.QueryRow("SELECT on_hand FROM stock WHERE sku = ?", sku).Scan(&onHand); err != nil {
		t.Fatal(err)
	}
	if onHand != 3 {
		t.Fatalf("on_hand = %d, want 3 after one unit", onHand)
	}
	if got := stripe.last(t); !strings.Contains(got.Body, "amount=1500") {
		t.Fatalf("stripe was not charged the order amount: %s", got.Body)
	}
}

func migrateTimescale(t *testing.T) {
	t.Helper()
	pool, err := pgxpool.New(context.Background(), timescaleDSN)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	eventually(t, "timescaledb", func() error { return pool.Ping(context.Background()) })
	applySQLFiles(t, filepath.Join(migrationsDir(t), "accounting"), func(stmt string) error {
		_, err := pool.Exec(context.Background(), stmt)
		return err
	})
}

// waitRabbit waits until RabbitMQ completes an AMQP handshake. Its port accepts TCP before the broker is ready.
func waitRabbit(t *testing.T) {
	t.Helper()
	eventually(t, "rabbitmq", func() error {
		conn, err := amqp.Dial(rabbitURL)
		if err != nil {
			return err
		}
		return conn.Close()
	})
}

// ensureKafkaTopic waits for the broker and creates the topic with one partition, so the first write does not race
// topic creation.
func ensureKafkaTopic(t *testing.T, topic string) {
	t.Helper()
	eventually(t, "kafka", func() error {
		conn, err := kafka.Dial("tcp", kafkaBroker)
		if err != nil {
			return err
		}
		defer conn.Close()
		err = conn.CreateTopics(kafka.TopicConfig{Topic: topic, NumPartitions: 1, ReplicationFactor: 1})
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			return err
		}
		return nil
	})
}
