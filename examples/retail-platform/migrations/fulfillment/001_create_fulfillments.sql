-- +goose Up
CREATE TABLE fulfillments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    shipped_at TIMESTAMP
);

-- +goose Down
DROP TABLE fulfillments;
