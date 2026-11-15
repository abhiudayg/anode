-- ClickHouse: append-only audit records written by services/auditlog.
CREATE TABLE IF NOT EXISTS audit_log
(
    actor  String,
    action String,
    target String,
    ts     DateTime
)
ENGINE = MergeTree
ORDER BY ts;
