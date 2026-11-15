-- +goose Up
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- +goose Down
DROP TABLE orders;
