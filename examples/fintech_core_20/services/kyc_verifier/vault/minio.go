package vault

import (
	"database/sql"
	"os"
)

type DocumentVault struct {
	db *sql.DB
}

func New() (*DocumentVault, error) {
	url := os.Getenv("KYC_MINIO_URL")
	db, err := sql.Open("minio", url)
	if err != nil {
		return nil, err
	}
	return &DocumentVault{db: db}, nil
}

func (v *DocumentVault) Close() error {
	return v.db.Close()
}
