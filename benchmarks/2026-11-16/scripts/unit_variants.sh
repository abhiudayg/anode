#!/bin/bash
# Which part of the anode systemd path costs the time? Same binary, same readiness check.
set -u
B=/root/bench
OUT=$B/variants.tsv
TRIALS=${TRIALS:-10}
install -m 755 $B/hello /usr/local/bin/hello-bench

mkunit() { # name port extra-lines...
  local name=$1 port=$2; shift 2
  { echo "[Unit]"; echo "After=network.target"; echo "[Service]"; echo "Type=simple"; echo "Environment=PORT=$port"
    for l in "$@"; do echo "$l"; done
    echo "ExecStart=/usr/local/bin/hello-bench"; } > /etc/systemd/system/$name.service
}
HARD="ProtectSystem=strict|NoNewPrivileges=true|PrivateTmp=true|PrivateDevices=true|ProtectKernelTunables=true|ProtectControlGroups=true|ProtectKernelModules=true|ProtectKernelLogs=true|ProtectClock=true|RestrictSUIDSGID=true|RestrictRealtime=true|RestrictNamespaces=true|LockPersonality=true|MemoryDenyWriteExecute=true|RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6|CapabilityBoundingSet=|AmbientCapabilities=|UMask=0077|ProtectProc=invisible|ProtectHome=true"
IFS='|' read -r -a HARDLINES <<< "$HARD"

mkunit bench-full 21061 "DynamicUser=yes" "StateDirectory=hello" "CPUQuota=200%" "MemoryMax=1G" "${HARDLINES[@]}"
mkunit bench-nosandbox 21062 "DynamicUser=yes" "StateDirectory=hello"
mkunit bench-nodynuser 21063 "${HARDLINES[@]}"
mkunit bench-bare 21064
systemctl daemon-reload

ready() {
  local port=$1 deadline=$(( $(date +%s) + 30 )) resp
  while :; do
    if exec 3<>/dev/tcp/127.0.0.1/$port 2>/dev/null; then
      printf 'GET /healthz HTTP/1.0\r\nHost: x\r\n\r\n' >&3
      read -r resp <&3
      exec 3<&- 3>&-
      case "$resp" in *" 200"*) return 0 ;; esac
    fi
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done
}
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
drop() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; }

printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 "$TRIALS"); do
  for u in bench-full bench-nosandbox bench-nodynuser bench-bare; do
    port=$(systemctl show -p Environment --value $u.service | sed 's/.*PORT=\([0-9]*\).*/\1/')
    systemctl stop $u 2>/dev/null; drop; t0=$(now_us)
    systemctl start $u; ready $port; t1=$(now_us)
    printf "%s\t%s\t%s\n" "$t" "$u" "$(( t1 - t0 ))" >> $OUT
    systemctl stop $u
  done
  drop; t0=$(now_us)
  PORT=21065 /usr/local/bin/hello-bench >/dev/null 2>&1 & pid=$!
  ready 21065; t1=$(now_us)
  printf "%s\tdirect-exec\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT
  kill $pid; wait $pid 2>/dev/null
done
echo done
