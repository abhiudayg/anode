-- +goose Up
CREATE TABLE loyalty_points (
    user_id UUID PRIMARY KEY,
    points INT DEFAULT 0,
    tier VARCHAR(32) DEFAULT 'bronze'
);
