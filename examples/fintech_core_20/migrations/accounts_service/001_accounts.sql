-- +goose Up
CREATE TABLE bank_accounts (
    account_id UUID PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance_cents BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
