#!/bin/bash
# Polls /version through Caddy (127.0.0.1:80) every ~50 ms. Logs: epoch_ms  http_code  body  (or ERR on failure).
END=$(( $(date +%s) + ${DURATION:-60} ))
while [ "$(date +%s)" -lt "$END" ]; do
  t=$(date +%s%3N)
  out=$(curl -s -m 2 -H "Host: 34.60.218.225" -w '%{http_code}' http://127.0.0.1/version 2>/dev/null); rc=$?
  if [ $rc -ne 0 ]; then echo "$t ERR rc=$rc"; else echo "$t ${out: -3} ${out%???}"; fi
  sleep 0.05
done
echo done
