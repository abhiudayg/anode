-- PostgreSQL: orders written by services/orders.
CREATE TABLE IF NOT EXISTS orders (
    id           TEXT        PRIMARY KEY,
    customer_id  TEXT        NOT NULL,
    sku          TEXT        NOT NULL,
    quantity     INTEGER     NOT NULL CHECK (quantity > 0),
    amount_cents BIGINT      NOT NULL CHECK (amount_cents >= 0),
    status       TEXT        NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id);
