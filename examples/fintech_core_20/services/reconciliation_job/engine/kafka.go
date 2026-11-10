package engine

import (
	"database/sql"
	"os"
)

type EventStream struct {
	db *sql.DB
}

func New() (*EventStream, error) {
	brokers := os.Getenv("RECON_KAFKA_BROKERS")
	db, err := sql.Open("kafka", brokers)
	if err != nil {
		return nil, err
	}
	return &EventStream{db: db}, nil
}

func (e *EventStream) Close() error {
	return e.db.Close()
}
