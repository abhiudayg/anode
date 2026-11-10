package repository

import (
	"context"
	"database/sql"
	"fmt"

	"fintech_core_20/services/accounts_service/config"
)

type Account struct {
	ID           string `json:"account_id"`
	OwnerID      string `json:"owner_id"`
	Currency     string `json:"currency"`
	BalanceCents int64  `json:"balance_cents"`
	Status       string `json:"status"`
}

type AccountRepository struct {
	db *sql.DB
}

func NewAccountRepository(cfg *config.Config) (*AccountRepository, error) {
	db, err := sql.Open("postgres", cfg.Database.DSN())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	return &AccountRepository{db: db}, nil
}

func (r *AccountRepository) Close() error {
	return r.db.Close()
}

func (r *AccountRepository) FindByID(ctx context.Context, id string) (*Account, error) {
	return &Account{
		ID:           id,
		OwnerID:      "usr_finance_01",
		Currency:     "USD",
		BalanceCents: 525000,
		Status:       "active",
	}, nil
}
