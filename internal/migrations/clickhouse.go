package migrations

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
)

type ClickHouse struct {
	Endpoint string
	Database string
	User     string
	Password string
	Client   *http.Client
}

func (c ClickHouse) Apply(dir string) (int, error) {
	if _, err := c.do(fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (name String, applied_at DateTime DEFAULT now()) ENGINE = MergeTree ORDER BY name", trackingTable)); err != nil {
		return 0, fmt.Errorf("create %s: %w", trackingTable, err)
	}
	listing, err := c.do(fmt.Sprintf("SELECT name FROM %s FORMAT TabSeparated", trackingTable))
	if err != nil {
		return 0, fmt.Errorf("read %s: %w", trackingTable, err)
	}
	applied := make(map[string]bool)
	for _, name := range strings.Fields(listing) {
		applied[name] = true
	}
	files, err := migrationFiles(dir, ".sql")
	if err != nil {
		return 0, err
	}
	count := 0
	for _, path := range files {
		name := filepath.Base(path)
		if applied[name] {
			continue
		}
		script, err := readMigration(path)
		if err != nil {
			return count, err
		}
		for _, stmt := range SplitStatements(script) {
			if _, err := c.do(stmt); err != nil {
				return count, fmt.Errorf("%s: %w", name, err)
			}
		}
		if _, err := c.do(fmt.Sprintf("INSERT INTO %s (name) VALUES ('%s')", trackingTable, quoteLiteral(name))); err != nil {
			return count, fmt.Errorf("record %s: %w", name, err)
		}
		count++
	}
	return count, nil
}

func (c ClickHouse) do(statement string) (string, error) {
	endpoint, err := url.Parse(c.Endpoint)
	if err != nil {
		return "", err
	}
	query := endpoint.Query()
	query.Set("database", c.Database)
	endpoint.RawQuery = query.Encode()
	req, err := http.NewRequest(http.MethodPost, endpoint.String(), strings.NewReader(statement))
	if err != nil {
		return "", err
	}
	if c.User != "" {
		req.SetBasicAuth(c.User, c.Password)
	}
	client := c.Client
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer func() {
		_ = resp.Body.Close()
	}()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("clickhouse returned %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	return string(body), nil
}
