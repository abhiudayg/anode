-- +goose Up
-- MariaDB: stock counters served by services/inventory. Reservations decrement on_hand under a Redis lock.
CREATE TABLE IF NOT EXISTS stock (
    sku     VARCHAR(64) PRIMARY KEY,
    on_hand INT NOT NULL CHECK (on_hand >= 0)
);

-- +goose Down
-- No automatic rollback: restore from backup to undo this migration.
