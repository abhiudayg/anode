-- +goose Up
CREATE TABLE prescriptions (
    rx_id UUID PRIMARY KEY,
    patient_mrn UUID NOT NULL,
    medication_name VARCHAR(128) NOT NULL,
    dosage VARCHAR(64) NOT NULL,
    refills_remaining INT DEFAULT 0,
    prescribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
