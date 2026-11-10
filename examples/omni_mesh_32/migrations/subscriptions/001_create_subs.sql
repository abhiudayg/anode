-- +goose Up
CREATE TABLE subscriptions (
    sub_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    plan VARCHAR(64) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL
);
