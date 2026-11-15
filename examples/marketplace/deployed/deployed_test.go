//go:build deployed

package deployed

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func baseURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("MARKETPLACE_URL")
	if url == "" {
		t.Fatal("MARKETPLACE_URL must name the deployed marketplace, for example https://shop.example.com")
	}
	return strings.TrimRight(url, "/")
}

func post(t *testing.T, url string, body any) (int, []byte) {
	t.Helper()
	payload, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		t.Fatalf("POST %s: %v", url, err)
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, out
}

func TestSearchFindsIndexedProduct(t *testing.T) {
	base := baseURL(t)
	sku := fmt.Sprintf("check-%d", time.Now().UnixNano())
	vector := []float64{0.11, 0.42, 0.73, 0.5}

	status, body := post(t, base+"/v1/index", map[string]any{"sku": sku, "name": "deployed check", "vector": vector})
	if status != http.StatusAccepted {
		t.Fatalf("index: want 202, got %d: %s (a 502 usually means the Qdrant collection \"products\" does not exist yet)", status, body)
	}

	deadline := time.Now().Add(30 * time.Second)
	for {
		status, body = post(t, base+"/v1/search", map[string]any{"vector": vector, "limit": 3})
		if status != http.StatusOK {
			t.Fatalf("search: want 200, got %d: %s", status, body)
		}
		if strings.Contains(string(body), sku) {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("search did not return %s within 30s: %s", sku, body)
		}
		time.Sleep(time.Second)
	}
}

func TestReturnWorkflowStarts(t *testing.T) {
	base := baseURL(t)
	id := fmt.Sprintf("deployed-%d", time.Now().UnixNano())
	status, body := post(t, base+"/v1/workflows/returns/"+id, map[string]any{
		"order_id": id, "sku": "check-sku", "quantity": 1, "from_zip": "10001", "to_zip": "94105",
	})
	if status != http.StatusAccepted {
		t.Fatalf("return workflow: want 202, got %d: %s", status, body)
	}
	var started struct {
		WorkflowID string `json:"workflow_id"`
		RunID      string `json:"run_id"`
	}
	if err := json.Unmarshal(body, &started); err != nil || started.WorkflowID == "" || started.RunID == "" {
		t.Fatalf("return workflow must report its workflow and run IDs, got %s", body)
	}
}
