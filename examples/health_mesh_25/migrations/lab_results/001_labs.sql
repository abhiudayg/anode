-- +goose Up
CREATE TABLE lab_specimens (
    specimen_id UUID PRIMARY KEY,
    patient_mrn UUID NOT NULL,
    test_code VARCHAR(64) NOT NULL,
    result_value NUMERIC(10, 4),
    units VARCHAR(32),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
