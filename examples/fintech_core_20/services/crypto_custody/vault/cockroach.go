package vault

import (
	"database/sql"
	"os"
)

type CryptoVault struct {
	db *sql.DB
}

func New() (*CryptoVault, error) {
	url := os.Getenv("CRYPTO_COCKROACH_URL")
	db, err := sql.Open("cockroachdb", url)
	if err != nil {
		return nil, err
	}
	return &CryptoVault{db: db}, nil
}

func (v *CryptoVault) Close() error {
	return v.db.Close()
}
