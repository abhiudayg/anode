#!/bin/bash
# Root, in the VM. Installs slowsvc and four Caddy front ends (2x2 arms).
set -eu
install -d -m 755 /var/lib/bench
install -m 755 "/private/tmp/claude-501/-Volumes-Seagate-developer-personal-anode/9caf140c-e476-4a8f-8f45-5897796e9037/scratchpad/slowsvc.linux" /var/lib/bench/slowsvc
for mode in plain drain; do
  port=$([ "$mode" = plain ] && echo 9030 || echo 9031)
  cat > /etc/systemd/system/anode-$mode.service <<UNIT
[Unit]
Description=drain experiment ($mode)
After=network.target
[Service]
Type=simple
ExecStart=/var/lib/bench/slowsvc -mode $mode -port $port
Restart=always
RestartSec=3
KillSignal=SIGTERM
TimeoutStopSec=10
[Install]
WantedBy=multi-user.target
UNIT
done
systemctl daemon-reload
systemctl restart anode-plain.service anode-drain.service
mk() { # name listen upstream lb
  f=/var/lib/bench/Caddy.$1
  if [ "$4" = retry ]; then
    printf '{\n  admin off\n}\n:%s {\n  reverse_proxy 127.0.0.1:%s {\n    lb_try_duration 15s\n    lb_try_interval 100ms\n  }\n}\n' "$2" "$3" > "$f"
  else
    printf '{\n  admin off\n}\n:%s {\n  reverse_proxy 127.0.0.1:%s\n}\n' "$2" "$3" > "$f"
  fi
  systemd-run --unit caddy-$1 --collect caddy run --config "$f" --adapter caddyfile >/dev/null 2>&1 || true
}
for c in plain-noretry plain-retry drain-noretry drain-retry; do systemctl stop caddy-$c 2>/dev/null || true; done
mk plain-noretry 8090 9030 noretry
mk plain-retry 8091 9030 retry
mk drain-noretry 8092 9031 noretry
mk drain-retry 8093 9031 retry
sleep 3
for p in 9030 9031 8090 8091 8092 8093; do printf "%s " $p; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:$p/healthz; done
