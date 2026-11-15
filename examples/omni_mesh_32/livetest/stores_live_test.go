//go:build live

package livetest

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"

	amqp "github.com/rabbitmq/amqp091-go"
)

const unreachable = "http://127.0.0.1:1"

func TestUsersAndAuthSessionsAgainstPostgresAndRedis(t *testing.T) {
	migratePostgres(t)
	users := startService(t, "users", map[string]string{"USERS_POSTGRES_DSN": pgDSN})
	auth := startService(t, "auth", map[string]string{"AUTH_REDIS_ADDR": redisAddr, "USERS_SERVICE_URL": users})

	email := "live-" + uniq() + "@example.test"
	status, body := postJSON(t, http.MethodPost, users+"/v1/users",
		map[string]string{"email": email, "password": "correct-horse-1", "name": "Live"})
	requireStatus(t, status, http.StatusCreated, body)

	status, body = postJSON(t, http.MethodPost, users+"/v1/users/verify",
		map[string]string{"email": email, "password": "wrong-password"})
	requireStatus(t, status, http.StatusUnauthorized, body)

	status, body = postJSON(t, http.MethodPost, auth+"/v1/auth/login",
		map[string]string{"email": email, "password": "correct-horse-1"})
	requireStatus(t, status, http.StatusOK, body)
	var login struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(body, &login); err != nil || login.Token == "" {
		t.Fatalf("login returned no token: %s", body)
	}

	status, body = postJSON(t, http.MethodGet, auth+"/v1/auth/session/"+login.Token, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), email) {
		t.Fatalf("session does not name the user: %s", body)
	}
	_ = openRedis(t)
}

func TestCouponsAndLoyaltyAgainstPostgresMemcachedAndRedis(t *testing.T) {
	migratePostgres(t)
	coupons := startService(t, "coupons", map[string]string{
		"COUPONS_POSTGRES_DSN":   pgDSN,
		"COUPONS_MEMCACHED_ADDR": memcachedAddr,
	})
	code := "LIVE" + uniq()
	status, body := postJSON(t, http.MethodPost, coupons+"/v1/coupons", map[string]any{"code": code, "percent_off": 15})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, coupons+"/v1/coupons/"+code, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"percent_off":15`) {
		t.Fatalf("coupon = %s, want percent_off 15", body)
	}

	loyalty := startService(t, "loyalty", map[string]string{
		"LOYALTY_POSTGRES_DSN": pgDSN,
		"LOYALTY_REDIS_ADDR":   redisAddr,
	})
	customer := "cust-" + uniq()
	for _, points := range []int{10, 5} {
		status, body = postJSON(t, http.MethodPost, loyalty+"/v1/loyalty/points", map[string]any{"customer_id": customer, "points": points})
		requireStatus(t, status, http.StatusCreated, body)
	}
	status, body = postJSON(t, http.MethodGet, loyalty+"/v1/loyalty/points/"+customer, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"points":15`) {
		t.Fatalf("points = %s, want 15", body)
	}
}

func TestPricingAndLivechatAgainstValkeyAndRedis(t *testing.T) {
	pricing := startService(t, "pricing", map[string]string{"PRICING_VALKEY_ADDR": valkeyAddr})
	sku := "sku-" + uniq()
	status, body := postJSON(t, http.MethodPut, pricing+"/v1/pricing/"+sku, map[string]any{"sku": sku, "amount_cents": 1299})
	requireStatus(t, status, http.StatusOK, body)
	status, body = postJSON(t, http.MethodGet, pricing+"/v1/pricing/"+sku, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"amount_cents":1299`) {
		t.Fatalf("price = %s, want 1299", body)
	}

	livechat := startService(t, "livechat", map[string]string{"LIVECHAT_REDIS_ADDR": redisAddr})
	room := "room-" + uniq()
	status, body = postJSON(t, http.MethodPost, livechat+"/v1/livechat/rooms/"+room+"/messages",
		map[string]string{"author": "agent", "text": "hello from live"})
	requireStatus(t, status, http.StatusAccepted, body)
	status, body = postJSON(t, http.MethodGet, livechat+"/v1/livechat/rooms/"+room+"/history", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), "hello from live") {
		t.Fatalf("history = %s, want the message", body)
	}
}

func TestInventoryReservesStockInMariaDB(t *testing.T) {
	migrateMaria(t)
	sku := "sku-" + uniq()
	db := openMaria(t)
	if _, err := db.Exec("INSERT INTO stock (sku, on_hand) VALUES (?, 5)", sku); err != nil {
		t.Fatalf("seed stock: %v", err)
	}
	inventory := startService(t, "inventory", map[string]string{
		"INVENTORY_MARIADB_DSN":      mariaDSN,
		"INVENTORY_LOCKS_REDIS_ADDR": redisAddr,
	})
	status, body := postJSON(t, http.MethodPost, inventory+"/v1/inventory/reserve", map[string]any{"sku": sku, "quantity": 2})
	requireStatus(t, status, http.StatusCreated, body)

	var onHand int
	if err := db.QueryRow("SELECT on_hand FROM stock WHERE sku = ?", sku).Scan(&onHand); err != nil {
		t.Fatal(err)
	}
	if onHand != 3 {
		t.Fatalf("on_hand = %d, want 3 after reserving 2 of 5", onHand)
	}
}

func TestCatalogAndReviewsAgainstMongoDB(t *testing.T) {
	catalog := startService(t, "catalog", map[string]string{
		"CATALOG_MONGO_URI":  mongoURI,
		"SEARCH_SERVICE_URL": unreachable,
	})
	sku := "sku-" + uniq()
	status, body := postJSON(t, http.MethodPost, catalog+"/v1/catalog/items", map[string]any{"sku": sku, "name": "Live item", "price_cents": 500})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, catalog+"/v1/catalog/items", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), sku) {
		t.Fatalf("catalog does not list %s: %s", sku, body)
	}

	reviews := startService(t, "reviews", map[string]string{"REVIEWS_MONGO_URI": mongoURI})
	status, body = postJSON(t, http.MethodPost, reviews+"/v1/reviews", map[string]any{"sku": sku, "author": "tester", "stars": 4, "text": "good"})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, reviews+"/v1/reviews?sku="+sku, nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"stars":4`) {
		t.Fatalf("reviews = %s, want the review", body)
	}
}

func TestQueueServicesPublishToRabbitMQ(t *testing.T) {
	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		t.Fatalf("rabbitmq: %v", err)
	}
	defer conn.Close()
	ch, err := conn.Channel()
	if err != nil {
		t.Fatal(err)
	}
	defer ch.Close()

	cases := []struct {
		service string
		env     string
		path    string
		queue   string
		payload any
		status  int
	}{
		{"webhooks", "WEBHOOKS_RABBITMQ_URL", "/v1/webhooks/dispatch",
			"webhooks.dispatch", map[string]any{"event_type": "order.paid", "target_url": "https://partner.example.test/hook", "payload": map[string]any{"id": 1}}, http.StatusAccepted},
		{"warehouse", "WAREHOUSE_RABBITMQ_URL", "/v1/warehouse/picks", "warehouse.picks",
			map[string]any{"order_id": "o-live", "sku": "sku-1", "quantity": 1, "to_zip": "94105", "from_zip": "10001"}, http.StatusAccepted},
		{"email", "EMAIL_RABBITMQ_URL", "/v1/email/send", "email.outbound",
			map[string]any{"to": "tester@example.test", "subject": "live", "body": "hi"}, http.StatusAccepted},
	}
	for _, tc := range cases {
		env := map[string]string{tc.env: rabbitURL, "AUDITLOG_SERVICE_URL": unreachable, "SHIPPING_SERVICE_URL": unreachable}
		base := startService(t, tc.service, env)
		status, body := postJSON(t, http.MethodPost, base+tc.path, tc.payload)
		requireStatus(t, status, tc.status, body)
		var msg amqp.Delivery
		var got bool
		eventually(t, tc.service+" queue "+tc.queue, func() error {
			m, ok, err := ch.Get(tc.queue, true)
			if err != nil {
				return err
			}
			if !ok {
				return fmt.Errorf("no message yet")
			}
			msg, got = m, true
			return nil
		})
		if !got {
			t.Fatalf("%s: no message on %s", tc.service, tc.queue)
		}
		if !strings.Contains(string(msg.Body), "{") {
			t.Fatalf("%s: message on %s is not JSON: %s", tc.service, tc.queue, msg.Body)
		}
	}
}

func TestClickHouseServicesRecordEvents(t *testing.T) {
	migrateClickhouse(t)
	clickEnv := func(prefix string) map[string]string {
		return map[string]string{
			prefix + "_CLICKHOUSE_ADDR":     clickAddr,
			prefix + "_CLICKHOUSE_DB":       clickDB,
			prefix + "_CLICKHOUSE_USER":     clickUser,
			prefix + "_CLICKHOUSE_PASSWORD": clickPassword,
		}
	}

	analytics := startService(t, "analytics", clickEnv("ANALYTICS"))
	status, body := postJSON(t, http.MethodGet, analytics+"/v1/events/count", nil)
	requireStatus(t, status, http.StatusOK, body)
	var before struct {
		Events uint64 `json:"events"`
	}
	_ = json.Unmarshal(body, &before)
	status, body = postJSON(t, http.MethodPost, analytics+"/v1/events", map[string]string{"name": "view", "user_id": "u-" + uniq()})
	requireStatus(t, status, http.StatusAccepted, body)
	status, body = postJSON(t, http.MethodGet, analytics+"/v1/events/count", nil)
	requireStatus(t, status, http.StatusOK, body)
	var after struct {
		Events uint64 `json:"events"`
	}
	_ = json.Unmarshal(body, &after)
	if after.Events != before.Events+1 {
		t.Fatalf("events = %d, want %d", after.Events, before.Events+1)
	}

	auditlog := startService(t, "auditlog", clickEnv("AUDITLOG"))
	target := "order-" + uniq()
	status, body = postJSON(t, http.MethodPost, auditlog+"/v1/audit", map[string]string{"actor": "live", "action": "checked", "target": target})
	requireStatus(t, status, http.StatusCreated, body)
	status, body = postJSON(t, http.MethodGet, auditlog+"/v1/audit/recent", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), target) {
		t.Fatalf("audit log does not contain %s", target)
	}

	metrics := startService(t, "metrics", clickEnv("METRICS"))
	name := "latency-" + uniq()
	status, body = postJSON(t, http.MethodPost, metrics+"/v1/metrics", map[string]any{"name": name, "value": 42})
	requireStatus(t, status, http.StatusAccepted, body)
	status, body = postJSON(t, http.MethodGet, metrics+"/v1/metrics/"+name+"/avg", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), `"avg_last_hour":42`) {
		t.Fatalf("avg = %s, want 42", body)
	}
}

func TestSearchAndRecommendationsAgainstQdrant(t *testing.T) {
	createQdrantCollection(t, "products", 4)
	search := startService(t, "search", map[string]string{"SEARCH_QDRANT_URL": qdrantURL})
	sku := "sku-" + uniq()
	status, body := postJSON(t, http.MethodPost, search+"/v1/index", map[string]any{
		"sku": sku, "name": "Live item", "vector": []float64{0.1, 0.2, 0.3, 0.4},
	})
	requireStatus(t, status, http.StatusAccepted, body)
	status, body = postJSON(t, http.MethodPost, search+"/v1/search", map[string]any{"vector": []float64{0.1, 0.2, 0.3, 0.4}, "limit": 3})
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), sku) {
		t.Fatalf("search does not return %s: %s", sku, body)
	}

	recs := startService(t, "recommendations", map[string]string{
		"RECS_REDIS_ADDR": redisAddr,
		"RECS_QDRANT_URL": qdrantURL,
	})
	status, body = postJSON(t, http.MethodGet, recs+"/v1/recommendations/u-"+uniq()+"?vector=0.1,0.2,0.3,0.4", nil)
	requireStatus(t, status, http.StatusOK, body)
	if !strings.Contains(string(body), "result") {
		t.Fatalf("recommendations response has no result: %s", body)
	}
}

func createQdrantCollection(t *testing.T, name string, size int) {
	t.Helper()
	body := map[string]any{"vectors": map[string]any{"size": size, "distance": "Cosine"}}
	status, out := postJSON(t, http.MethodPut, fmt.Sprintf("%s/collections/%s", qdrantURL, name), body)
	if status != http.StatusOK && status != http.StatusConflict {
		t.Fatalf("create collection %s: status %d: %s", name, status, out)
	}
}
