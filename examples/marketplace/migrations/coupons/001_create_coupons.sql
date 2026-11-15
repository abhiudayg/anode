-- +goose Up
-- PostgreSQL: promotional codes served by services/coupons (memcached is the read cache).
CREATE TABLE IF NOT EXISTS coupons (
    code        TEXT    PRIMARY KEY,
    percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 100)
);

-- +goose Down
-- No automatic rollback: restore from backup to undo this migration.
