package olap

import (
	"database/sql"
	"os"
)

type Analytics struct {
	db *sql.DB
}

func New() (*Analytics, error) {
	url := os.Getenv("RECON_CLICKHOUSE_URL")
	db, err := sql.Open("clickhouse", url)
	if err != nil {
		return nil, err
	}
	return &Analytics{db: db}, nil
}

func (a *Analytics) Close() error {
	return a.db.Close()
}
