package store

import (
	"database/sql"
	"os"
)

type ClickhouseAudit struct {
	db *sql.DB
}

func New() (*ClickhouseAudit, error) {
	url := os.Getenv("COMPLIANCE_CLICKHOUSE_URL")
	db, err := sql.Open("clickhouse", url)
	if err != nil {
		return nil, err
	}
	return &ClickhouseAudit{db: db}, nil
}

func (c *ClickhouseAudit) Close() error {
	return c.db.Close()
}
