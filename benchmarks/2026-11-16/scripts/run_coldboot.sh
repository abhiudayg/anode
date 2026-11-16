#!/bin/bash
# Runs inside the anode-bench OrbStack VM (Debian 12, systemd PID 1).
# Compares cold start to /healthz 200 for anode's systemd unit vs Docker running the same binary,
# then measures idle memory for each arm running alone.
set -u
B=/root/bench
OUT=$B/coldboot.tsv
TRIALS=${TRIALS:-10}
ANODE_PORT=21040
DOCKER_PORT=21041
mkdir -p $B
cp /var/lib/anode/releases/1794807130/hello $B/hello
printf 'FROM scratch\nCOPY hello /hello\nENTRYPOINT ["/hello"]\n' > $B/Dockerfile
docker build -q -t hello:bench $B >/dev/null

drop_caches() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null && echo yes || echo no; }

wait_healthz() {
  local port=$1 deadline=$(( $(date +%s) + 30 ))
  until [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://127.0.0.1:$port/healthz)" = 200 ]; do
    [ "$(date +%s)" -lt "$deadline" ] || { echo timeout; return 1; }
  done
}

now_ms() { echo $(( $(date +%s%N) / 1000000 )); }

printf "trial\tarm\tcold_boot_ms\tcache_dropped\n" > $OUT
for t in $(seq 1 "$TRIALS"); do
  systemctl stop anode-hello
  docker rm -f hello-docker >/dev/null 2>&1
  dc=$(drop_caches)
  t0=$(now_ms); systemctl start anode-hello; wait_healthz $ANODE_PORT; t1=$(now_ms)
  printf "%s\tanode-systemd\t%s\t%s\n" "$t" "$((t1 - t0))" "$dc" >> $OUT
  systemctl stop anode-hello
  docker rm -f hello-docker >/dev/null 2>&1
  dc=$(drop_caches)
  t0=$(now_ms); docker run -d --name hello-docker --network host -e PORT=$DOCKER_PORT hello:bench >/dev/null; wait_healthz $DOCKER_PORT; t1=$(now_ms)
  printf "%s\tdocker\t%s\t%s\n" "$t" "$((t1 - t0))" "$dc" >> $OUT
  docker rm -f hello-docker >/dev/null 2>&1
done

idle_anode() {
  systemctl start anode-hello; wait_healthz $ANODE_PORT; sleep 20
  local pid rss cg
  pid=$(systemctl show -p MainPID --value anode-hello)
  rss=$(awk '/VmRSS/ {print $2}' /proc/$pid/status)
  cg=$(systemctl show -p MemoryCurrent --value anode-hello)
  printf "anode-systemd\tservice_rss_kb\t%s\n" "$rss" >> $B/idle.tsv
  printf "anode-systemd\tcgroup_memory_current_bytes\t%s\n" "$cg" >> $B/idle.tsv
  systemctl stop anode-hello
}

idle_docker() {
  docker run -d --name hello-docker --network host -e PORT=$DOCKER_PORT hello:bench >/dev/null; wait_healthz $DOCKER_PORT; sleep 20
  local pid cid cg daemon_rss
  pid=$(docker inspect -f '{{.State.Pid}}' hello-docker)
  cid=$(docker inspect -f '{{.Id}}' hello-docker)
  rss=$(awk '/VmRSS/ {print $2}' /proc/$pid/status)
  cg=$(cat $(find /sys/fs/cgroup -path "*docker-${cid}*" -name memory.current 2>/dev/null | head -1) 2>/dev/null)
  printf "docker\tservice_rss_kb\t%s\n" "$rss" >> $B/idle.tsv
  printf "docker\tcgroup_memory_current_bytes\t%s\n" "${cg:-0}" >> $B/idle.tsv
  daemon_rss=0
  for p in $(pgrep -x dockerd) $(pgrep -x containerd) $(pgrep -f containerd-shim); do
    daemon_rss=$(( daemon_rss + $(awk '/VmRSS/ {print $2}' /proc/$p/status) ))
  done
  printf "docker\truntime_daemons_rss_kb\t%s\n" "$daemon_rss" >> $B/idle.tsv
  docker rm -f hello-docker >/dev/null 2>&1
}

: > $B/idle.tsv
idle_anode
idle_docker
echo done
