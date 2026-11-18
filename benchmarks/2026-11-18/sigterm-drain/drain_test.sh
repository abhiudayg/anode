#!/bin/bash
# usage: sudo drain_test.sh <orders-binary> <caddyfile> <label>
# Needs a loadgen binary at $S/loadgen (build: cd loadgen && go build -o ../loadgen .)
set -u
S="${S:-$(cd "$(dirname "$0")" && pwd)}"
BIN="$1"; CF="$2"; LABEL="$3"
install -m 755 "$BIN" /usr/local/bin/proof-orders
cat > /etc/systemd/system/proof-orders.service <<UNIT
[Unit]
Description=proof orders
[Service]
ExecStart=/usr/local/bin/proof-orders
Environment=PORT=9020
Environment=ORDERS_POSTGRES_DSN=postgres://x@127.0.0.1:1/x
Restart=always
RestartSec=3
KillSignal=SIGTERM
TimeoutStopSec=10
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl restart proof-orders
pkill -f "caddy run --config /tmp/proof-caddy" 2>/dev/null; sleep 1
cp "$CF" /tmp/proof-caddy.Caddyfile
caddy run --config /tmp/proof-caddy.Caddyfile --adapter caddyfile > /tmp/proof-caddy.log 2>&1 &
for i in $(seq 1 50); do curl -fs -o /dev/null http://127.0.0.1:8080/healthz && break; sleep 0.2; done
echo "[$LABEL] ready"
"$S/loadgen" -url http://127.0.0.1:8080/healthz -c 50 -d 20s > /tmp/proof-load.txt &
LG=$!
sleep 8
echo "[$LABEL] SIGTERM at t=8s"
systemctl kill -s TERM proof-orders
wait $LG
echo "[$LABEL] $(cat /tmp/proof-load.txt)"
systemctl is-active proof-orders
