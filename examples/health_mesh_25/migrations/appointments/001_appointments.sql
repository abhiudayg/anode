-- +goose Up
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY,
    patient_mrn UUID NOT NULL,
    doctor_id VARCHAR(64) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) DEFAULT 'scheduled'
);
