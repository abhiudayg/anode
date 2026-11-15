-- +goose Up
-- TimescaleDB: double-entry ledger lines used by services/accounting.
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS ledger_entries (
    account      TEXT        NOT NULL,
    amount_cents BIGINT      NOT NULL,
    memo         TEXT        NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT create_hypertable('ledger_entries', 'created_at', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS ledger_entries_account_idx ON ledger_entries (account, created_at DESC);

-- +goose Down
-- No automatic rollback: restore from backup to undo this migration.
