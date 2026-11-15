-- +goose Up
-- PostgreSQL: marketing and blog pages served by services/cms.
CREATE TABLE IF NOT EXISTS pages (
    slug       TEXT        PRIMARY KEY,
    title      TEXT        NOT NULL,
    body       TEXT        NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
-- No automatic rollback: restore from backup to undo this migration.
