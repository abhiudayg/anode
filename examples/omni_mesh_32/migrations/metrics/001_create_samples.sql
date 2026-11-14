-- ClickHouse: telemetry samples written by services/metrics.
CREATE TABLE IF NOT EXISTS samples
(
    name  String,
    value Float64,
    ts    DateTime
)
ENGINE = MergeTree
ORDER BY (name, ts);
