package store

import (
	"database/sql"
	"os"
)

type TaxStore struct {
	db *sql.DB
}

func New() (*TaxStore, error) {
	url := os.Getenv("TAX_POSTGRES_URL")
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}
	return &TaxStore{db: db}, nil
}

func (s *TaxStore) Close() error {
	return s.db.Close()
}
