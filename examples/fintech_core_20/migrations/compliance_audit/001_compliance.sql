-- +goose Up
CREATE TABLE compliance_audit_log (
    audit_id UUID,
    subject_id VARCHAR(64),
    event_type VARCHAR(64),
    ip_address VARCHAR(45),
    details String,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (created_at, event_type);
