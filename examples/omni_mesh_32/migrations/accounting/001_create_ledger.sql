-- +goose Up
CREATE TABLE ledger_entries (
    entry_id UUID PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL,
    debit BIGINT DEFAULT 0,
    credit BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
