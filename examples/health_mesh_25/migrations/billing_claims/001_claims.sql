-- +goose Up
CREATE TABLE insurance_claims (
    claim_id UUID PRIMARY KEY,
    patient_mrn UUID NOT NULL,
    payer_id VARCHAR(64) NOT NULL,
    billed_amount_cents BIGINT NOT NULL,
    claim_status VARCHAR(32) DEFAULT 'submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
