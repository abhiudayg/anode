#!/bin/bash
# Precise cold-start timing inside the anode-bench VM.
# Clock: bash EPOCHREALTIME (microseconds, no fork). Ready = TCP connect + HTTP 200 on /healthz,
# checked with bash /dev/tcp (no fork per poll), so resolution is well under 1 ms.
set -u
B=/root/bench
OUT=$B/precise.tsv
TRIALS=${TRIALS:-10}
ANODE_PORT=21040
DIRECT_PORT=21050
DOCKER_PORT=21041

now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }

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

drop() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; }

printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 "$TRIALS"); do
  # 1. direct exec of the binary, no supervisor
  drop; t0=$(now_us)
  PORT=$DIRECT_PORT $B/hello >/dev/null 2>&1 &
  pid=$!
  ready $DIRECT_PORT
  t1=$(now_us)
  printf "%s\tdirect-exec\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT
  kill $pid; wait $pid 2>/dev/null

  # 2. anode systemd unit
  systemctl stop anode-hello; drop; t0=$(now_us)
  systemctl start anode-hello
  ready $ANODE_PORT
  t1=$(now_us)
  printf "%s\tanode-systemd\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT
  systemctl stop anode-hello

  # 3. docker container (image already built)
  docker rm -f hello-docker >/dev/null 2>&1; drop; t0=$(now_us)
  docker run -d --name hello-docker --network host -e PORT=$DOCKER_PORT hello:bench >/dev/null
  ready $DOCKER_PORT
  t1=$(now_us)
  printf "%s\tdocker\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT
  docker rm -f hello-docker >/dev/null 2>&1
done
echo done
