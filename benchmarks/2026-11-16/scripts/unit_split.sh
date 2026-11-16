#!/bin/bash
set -u
OUT=/root/bench/split.tsv
TRIALS=${TRIALS:-10}
mk() { local name=$1 port=$2; shift 2
  { echo "[Unit]"; echo "[Service]"; echo "Type=simple"; echo "Environment=PORT=$port"
    for l in "$@"; do echo "$l"; done; echo "ExecStart=/usr/local/bin/hello-bench"; } > /etc/systemd/system/$name.service; }
mk split-dynonly 21071 "DynamicUser=yes"
mk split-statedir-staticuser 21072 "User=nobody" "StateDirectory=hello"
mk split-dyn-statedir 21073 "DynamicUser=yes" "StateDirectory=hello"
systemctl daemon-reload
ready() { local port=$1 deadline=$(( $(date +%s) + 30 )) resp
  while :; do if exec 3<>/dev/tcp/127.0.0.1/$port 2>/dev/null; then printf 'GET /healthz HTTP/1.0\r\nHost: x\r\n\r\n' >&3; read -r resp <&3; exec 3<&- 3>&-; case "$resp" in *" 200"*) return 0;; esac; fi; [ "$(date +%s)" -lt "$deadline" ] || return 1; done; }
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
drop() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; }
printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 "$TRIALS"); do
  for pair in "split-dynonly:21071" "split-statedir-staticuser:21072" "split-dyn-statedir:21073"; do
    u=${pair%%:*}; port=${pair##*:}
    systemctl stop $u 2>/dev/null; drop; t0=$(now_us); systemctl start $u; ready $port; t1=$(now_us)
    printf "%s\t%s\t%s\n" "$t" "$u" "$(( t1 - t0 ))" >> $OUT; systemctl stop $u
  done
done
echo done
