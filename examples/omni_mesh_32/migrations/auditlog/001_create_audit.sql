-- +goose Up
CREATE TABLE audit_events (
    event_id UUID,
    actor_id VARCHAR(64),
    action VARCHAR(64),
    payload String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, event_id);
