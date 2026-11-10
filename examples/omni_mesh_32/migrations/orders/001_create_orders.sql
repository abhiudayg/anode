-- +goose Up
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    total_cents BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL
);
