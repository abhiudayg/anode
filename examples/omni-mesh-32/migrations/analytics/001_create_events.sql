-- ClickHouse: product events written by services/analytics.
CREATE TABLE IF NOT EXISTS events
(
    name    String,
    user_id String,
    ts      DateTime
)
ENGINE = MergeTree
ORDER BY (name, ts);
