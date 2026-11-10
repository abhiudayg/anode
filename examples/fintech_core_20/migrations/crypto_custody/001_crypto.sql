-- +goose Up
CREATE TABLE crypto_custody_wallets (
    wallet_id UUID PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    asset_symbol VARCHAR(16) NOT NULL,
    deposit_address VARCHAR(128) NOT NULL UNIQUE,
    confirmed_balance NUMERIC(36, 18) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
