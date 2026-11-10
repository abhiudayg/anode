-- +goose Up
CREATE TABLE issued_cards (
    card_id UUID PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL,
    card_number_masked VARCHAR(19) NOT NULL,
    card_type VARCHAR(16) NOT NULL DEFAULT 'virtual',
    spend_limit_cents BIGINT NOT NULL DEFAULT 100000,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
