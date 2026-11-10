package cache

import (
	"database/sql"
	"os"
)

type FXCache struct {
	db *sql.DB
}

func New() (*FXCache, error) {
	url := os.Getenv("FX_MEMCACHED_URL")
	db, err := sql.Open("memcached", url)
	if err != nil {
		return nil, err
	}
	return &FXCache{db: db}, nil
}

func (c *FXCache) Close() error {
	return c.db.Close()
}
