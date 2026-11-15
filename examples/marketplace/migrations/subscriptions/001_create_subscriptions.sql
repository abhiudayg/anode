-- +goose Up
-- CockroachDB: recurring plans served by services/subscriptions.
CREATE TABLE IF NOT EXISTS subscriptions (
    id          STRING      PRIMARY KEY,
    customer_id STRING      NOT NULL,
    plan        STRING      NOT NULL,
    renews_at   TIMESTAMPTZ NOT NULL
);

-- +goose Down
-- No automatic rollback: restore from backup to undo this migration.
