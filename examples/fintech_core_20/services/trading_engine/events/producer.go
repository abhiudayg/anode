package events

import (
	"database/sql"
	"os"
)

type EventBus struct {
	db *sql.DB
}

func New() (*EventBus, error) {
	brokers := os.Getenv("TRADING_KAFKA_BROKERS")
	db, err := sql.Open("kafka", brokers)
	if err != nil {
		return nil, err
	}
	return &EventBus{db: db}, nil
}

func (e *EventBus) Close() error {
	return e.db.Close()
}
