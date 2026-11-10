-- +goose Up
CREATE TABLE hipaa_access_events (
    event_id UUID,
    actor_id VARCHAR(64),
    patient_mrn UUID,
    resource_accessed VARCHAR(128),
    action VARCHAR(32),
    timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (timestamp, event_id);
