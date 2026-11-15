-- ScyllaDB: fraud evaluations written by services/fraud. Run in the keyspace named by FRAUD_SCYLLA_KEYSPACE.
CREATE TABLE IF NOT EXISTS checks (
    id           text PRIMARY KEY,
    amount_cents bigint,
    region       text,
    score        int,
    allowed      boolean
);
