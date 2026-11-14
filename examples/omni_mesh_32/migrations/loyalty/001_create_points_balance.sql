-- PostgreSQL: loyalty point balances served by services/loyalty (Redis is the read cache).
CREATE TABLE IF NOT EXISTS points_balance (
    customer_id TEXT   PRIMARY KEY,
    balance     BIGINT NOT NULL DEFAULT 0
);
