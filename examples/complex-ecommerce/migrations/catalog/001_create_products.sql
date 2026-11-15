-- +goose Up
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    inventory INT NOT NULL DEFAULT 0
);

-- +goose Down
DROP TABLE products;
