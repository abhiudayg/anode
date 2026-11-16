#!/bin/bash
# Runs on the GCE VM as root. 12 synthetic services, each with its own PostgreSQL database.
# Ready = all 12 services return 200 on /healthz, and each health check pings its own database.
# Arm A: anode units (host PostgreSQL). Arm B: Docker containers (postgres:15 container, same binaries).
set -u
B=/root/bench/many
OUT=$B/coldstart.tsv
IDLE=$B/idle.tsv
TRIALS=${TRIALS:-5}
N=12
mkdir -p $B
REL=/var/lib/anode/releases/$(ls -t /var/lib/anode/releases | grep -v sha256 | head -1)

# Docker images from the same binaries anode deployed.
for i in $(seq -w 1 $N); do
  mkdir -p $B/img$i && cp $REL/svc$i $B/img$i/svc$i
  printf 'FROM scratch\nCOPY svc%s /svc%s\nENTRYPOINT ["/svc%s"]\n' $i $i $i > $B/img$i/Dockerfile
  docker build -q -t svc$i:many $B/img$i >/dev/null
  port=$((21040 + 10#$i - 1))
  docker rm -f svc$i-c >/dev/null 2>&1
  docker create --name svc$i-c --network host --env-file $B/service.env -e PORT=$port svc$i:many >/dev/null
done

# Docker PostgreSQL with the same 12 roles and databases.
docker image inspect postgres:15 >/dev/null 2>&1 || docker pull -q postgres:15 >/dev/null
if ! docker inspect pg15 >/dev/null 2>&1; then
  systemctl stop postgresql
  docker run -d --name pg15 --network host -e POSTGRES_PASSWORD="$BENCH_PG_SUPER_PW" postgres:15 >/dev/null
  for k in $(seq 1 60); do docker exec pg15 pg_isready -q 2>/dev/null && break; sleep 1; done
  for i in $(seq -w 1 $N); do
    v="SVC${i}_PW"; pw="${!v}"
    docker exec -u postgres pg15 psql -qAt -c "CREATE ROLE svc$i LOGIN PASSWORD '$pw'" >/dev/null
    docker exec -u postgres pg15 psql -qAt -c "CREATE DATABASE svc$i OWNER svc$i" >/dev/null
  done
  docker stop pg15 >/dev/null
fi

units=""; ports=(); for i in $(seq -w 1 $N); do units="$units anode-svc$i"; ports+=($((21040 + 10#$i - 1))); done
dcont=""; for i in $(seq -w 1 $N); do dcont="$dcont svc$i-c"; done

stop_all() { systemctl stop $units postgresql 2>/dev/null; docker stop pg15 $dcont >/dev/null 2>&1; }
start_anode() { systemctl start postgresql $units; }
start_docker() { docker start pg15 >/dev/null; docker start $dcont >/dev/null; }

health() { curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:$1/healthz; }
ready_all() {
  local deadline=$(( $(date +%s) + 120 )) ok
  while :; do
    ok=1
    for p in "${ports[@]}"; do [ "$(health $p)" = 200 ] || { ok=0; break; }; done
    [ $ok = 1 ] && return 0
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done
}
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
drop() { sync; echo 3 > /proc/sys/vm/drop_caches; }

printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 $TRIALS); do
  stop_all; drop
  t0=$(now_us); start_anode; ready_all || echo "anode not ready $t" >&2; t1=$(now_us)
  printf "%s\tanode-12\t%s\n" $t $((t1-t0)) >> $OUT; stop_all

  drop
  t0=$(now_us); start_docker; ready_all || echo "docker not ready $t" >&2; t1=$(now_us)
  printf "%s\tdocker-12\t%s\n" $t $((t1-t0)) >> $OUT; stop_all
done

rss() { awk '/VmRSS/ {print $2}' /proc/$1/status 2>/dev/null; }
sum_pattern() { local s=0; for p in $(pgrep -x "$1" | sort -u); do s=$((s + $(rss $p))); done; echo $s; }
: > $IDLE
start_anode; ready_all; sleep 20
svc=0; for i in $(seq -w 1 $N); do pid=$(systemctl show -p MainPID --value anode-svc$i); svc=$((svc + $(rss $pid))); done
printf "anode-12\tservices_rss_kb\t%s\n" $svc >> $IDLE
printf "anode-12\tpostgres_rss_kb\t%s\n" "$(sum_pattern postgres)" >> $IDLE
printf "anode-12\tcgroup_services_bytes\t%s\n" "$(for i in $(seq -w 1 $N); do systemctl show -p MemoryCurrent --value anode-svc$i; done | awk '{s+=$1} END{print s}')" >> $IDLE
printf "anode-12\tcaddy_edge_rss_kb\t%s\n" "$(sum_pattern caddy)" >> $IDLE
stop_all

start_docker; ready_all; sleep 20
dsvc=0; for i in $(seq -w 1 $N); do pid=$(docker inspect -f '{{.State.Pid}}' svc$i-c); dsvc=$((dsvc + $(rss $pid))); done
printf "docker-12\tservices_rss_kb\t%s\n" $dsvc >> $IDLE
printf "docker-12\tpostgres_rss_kb\t%s\n" "$(sum_pattern postgres)" >> $IDLE
dd=0; for n in dockerd containerd containerd-shim; do dd=$((dd + $(sum_pattern $n))); done
printf "docker-12\tdaemons_rss_kb\t%s\n" $dd >> $IDLE
stop_all
echo done
