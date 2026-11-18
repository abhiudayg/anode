#!/bin/bash
# Run as root in the VM. Installs the orders binary, two units, and two Caddy instances.
set -eu
BIN="${BIN:?set BIN to the linux arm64 orders binary}"
S="$(cd "$(dirname "$0")/../units" && pwd)"
install -d -m 755 /var/lib/bench
install -m 755 "$BIN" /var/lib/bench/orders
install -m 644 "$S/bench-anode.unit" /etc/systemd/system/anode-orders.service
install -m 644 "$S/bench-bare.unit" /etc/systemd/system/bench-bare-orders.service
systemctl daemon-reload
systemctl restart anode-orders.service bench-bare-orders.service
printf '{\n  admin off\n}\n:8080 {\n  reverse_proxy 127.0.0.1:9020 {\n    lb_try_duration 5s\n    lb_try_interval 100ms\n  }\n}\n' > /var/lib/bench/Caddy.anode
printf '{\n  admin off\n}\n:8081 {\n  reverse_proxy 127.0.0.1:9021 {\n    lb_try_duration 5s\n    lb_try_interval 100ms\n  }\n}\n' > /var/lib/bench/Caddy.bare
systemd-run --unit bench-caddy-anode --collect caddy run --config /var/lib/bench/Caddy.anode --adapter caddyfile >/dev/null 2>&1 || true
systemd-run --unit bench-caddy-bare --collect caddy run --config /var/lib/bench/Caddy.bare --adapter caddyfile >/dev/null 2>&1 || true
sleep 3
for u in 9020 8080 9021 8081; do printf "%s " $u; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$u/healthz; done
