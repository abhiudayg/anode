-- +goose Up
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- +goose Down
DROP TABLE orders;
