-- ScyllaDB: charges and holds written by services/payments. Run in the keyspace named by PAYMENTS_SCYLLA_KEYSPACE.
CREATE TABLE IF NOT EXISTS charges (
    order_id     text,
    charge_id    text,
    amount_cents bigint,
    created_at   timestamp,
    PRIMARY KEY (order_id, charge_id)
);

CREATE TABLE IF NOT EXISTS holds (
    order_id   text,
    reason     text,
    created_at timestamp,
    PRIMARY KEY (order_id, created_at)
);
