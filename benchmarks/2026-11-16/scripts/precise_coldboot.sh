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

# Fails loudly: a cold-start sample is only valid if the page cache was really dropped.
drop() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || { echo "drop_caches failed" >&2; return 1; }; sleep 1; }

printf "trial\tarm\tready_us\n" > $OUT
: > $B/precise_failed.log
# docker: create once, time only `docker start` (same work as the GCE arm: gcp/gcp_bench.sh)
docker rm -f hello-docker >/dev/null 2>&1
docker create --name hello-docker --network host -e PORT=$DOCKER_PORT hello:bench >/dev/null
for t in $(seq 1 "$TRIALS"); do
  # a trial is kept only if every arm got a valid cold start; otherwise it is logged and not recorded (not retried)
  rows=""; ok=1
  # 1. direct exec of the binary, no supervisor
  drop || ok=0; t0=$(now_us)
  PORT=$DIRECT_PORT $B/hello >/dev/null 2>&1 &
  pid=$!
  ready $DIRECT_PORT || ok=0
  t1=$(now_us); rows="$rows$t\tdirect-exec\t$(( t1 - t0 ))\n"
  kill $pid; wait $pid 2>/dev/null

  # 2. anode systemd unit
  systemctl stop anode-hello; drop || ok=0; t0=$(now_us)
  systemctl start anode-hello
  ready $ANODE_PORT || ok=0
  t1=$(now_us); rows="$rows$t\tanode-systemd\t$(( t1 - t0 ))\n"
  systemctl stop anode-hello

  # 3. docker container (created once above; timed work is docker start)
  docker stop hello-docker >/dev/null 2>&1; drop || ok=0; t0=$(now_us)
  docker start hello-docker >/dev/null
  ready $DOCKER_PORT || ok=0
  t1=$(now_us); rows="$rows$t\tdocker\t$(( t1 - t0 ))\n"
  docker stop hello-docker >/dev/null 2>&1

  if [ $ok = 1 ]; then printf "$rows" >> $OUT
  else echo "trial $t: invalid (drop or ready failed), not recorded" >> $B/precise_failed.log; fi
done
docker rm -f hello-docker >/dev/null 2>&1
echo done
