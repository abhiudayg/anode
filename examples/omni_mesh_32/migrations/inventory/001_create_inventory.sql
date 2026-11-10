-- +goose Up
CREATE TABLE inventory (
    sku VARCHAR(64) PRIMARY KEY,
    quantity INT NOT NULL,
    reserved INT DEFAULT 0
);
