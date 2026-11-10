-- +goose Up
CREATE TABLE ledger_journal (
    journal_id UUID PRIMARY KEY,
    transaction_ref VARCHAR(128) NOT NULL UNIQUE,
    source_account VARCHAR(64) NOT NULL,
    destination_account VARCHAR(64) NOT NULL,
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ledger_source ON ledger_journal(source_account, posted_at DESC);
