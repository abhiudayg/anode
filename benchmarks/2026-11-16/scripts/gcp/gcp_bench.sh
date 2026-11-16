#!/bin/bash
# Runs on the GCE VM (Debian 12, e2-small). Anode systemd unit vs Docker container, same release binary.
set -u
B=/root/gcp
OUT=$B/coldstart.tsv
IDLE=$B/idle.tsv
TRIALS=${TRIALS:-10}
ANODE_PORT=21040
DOCKER_PORT=21041
mkdir -p $B
REL=/var/lib/anode/releases/$(ls -t /var/lib/anode/releases | grep -v sha256 | head -1)
cp $REL/hello $B/hello
printf 'FROM scratch\nCOPY hello /hello\nENTRYPOINT ["/hello"]\n' > $B/Dockerfile
docker build -q -t hello:gcp $B >/dev/null
docker rm -f hello-gcp >/dev/null 2>&1
docker create --name hello-gcp --network host -e PORT=$DOCKER_PORT hello:gcp >/dev/null
systemctl stop anode-hello

now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
drop() { sync; echo 3 > /proc/sys/vm/drop_caches; }
ready() { local port=$1 deadline=$(( $(date +%s) + 60 )) resp
  while :; do
    if exec 3<>/dev/tcp/127.0.0.1/$port 2>/dev/null; then
      printf 'GET /healthz HTTP/1.0\r\nHost: x\r\n\r\n' >&3; read -r resp <&3; exec 3<&- 3>&-
      case "$resp" in *" 200"*) return 0;; esac
    fi
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done; }

printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 $TRIALS); do
  systemctl stop anode-hello; docker stop hello-gcp >/dev/null 2>&1; drop
  t0=$(now_us); systemctl start anode-hello; ready $ANODE_PORT; t1=$(now_us)
  printf "%s\tanode-unit\t%s\n" $t $((t1-t0)) >> $OUT; systemctl stop anode-hello
  docker stop hello-gcp >/dev/null 2>&1; drop
  t0=$(now_us); docker start hello-gcp >/dev/null; ready $DOCKER_PORT; t1=$(now_us)
  printf "%s\tdocker\t%s\n" $t $((t1-t0)) >> $OUT; docker stop hello-gcp >/dev/null
done

rss() { awk '/VmRSS/ {print $2}' /proc/$1/status 2>/dev/null; }
: > $IDLE
systemctl start anode-hello; ready $ANODE_PORT; sleep 20
pid=$(systemctl show -p MainPID --value anode-hello)
printf "anode-unit\tservice_rss_kb\t%s\n" "$(rss $pid)" >> $IDLE
printf "anode-unit\tcgroup_memory_bytes\t%s\n" "$(systemctl show -p MemoryCurrent --value anode-hello)" >> $IDLE
printf "anode-unit\tcaddy_edge_rss_kb\t%s\n" "$(rss $(pgrep -x caddy | head -1))" >> $IDLE
systemctl stop anode-hello

docker start hello-gcp >/dev/null; ready $DOCKER_PORT; sleep 20
pid=$(docker inspect -f '{{.State.Pid}}' hello-gcp)
printf "docker\tservice_rss_kb\t%s\n" "$(rss $pid)" >> $IDLE
d=0; for p in $(pgrep -x dockerd; pgrep -x containerd; pgrep -x containerd-shim); do d=$((d + $(rss $p))); done
printf "docker\tdaemons_rss_kb\t%s\n" "$d" >> $IDLE
docker stop hello-gcp >/dev/null
echo done
