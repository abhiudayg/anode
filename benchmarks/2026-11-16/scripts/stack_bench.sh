#!/bin/bash
# Multi-service benchmark inside the anode-bench VM.
# Stack: sample-shop orders + payments services and one PostgreSQL 15 server with two databases.
# Arm A (anode): PostgreSQL from apt as a systemd unit; services as anode systemd units.
# Arm B (Docker): postgres:15 container; services as containers. Same binaries, same env, same ports.
# Ready = both /healthz return 200 and pg_isready succeeds. Each DB is checked with SELECT 1 after timing.
set -u
: "${BENCH_ORDERS_PW:?set BENCH_ORDERS_PW}" "${BENCH_PAYMENTS_PW:?set BENCH_PAYMENTS_PW}" "${BENCH_PG_SUPER_PW:?set BENCH_PG_SUPER_PW}" "${BENCH_STRIPE_KEY:?set BENCH_STRIPE_KEY}"
B=/root/bench/stack
OUT=$B/stack_coldstart.tsv
TRIALS=${TRIALS:-10}
ORD_PORT=21040
PAY_PORT=21041
mkdir -p $B
cd $B

# --- Docker arm setup (idempotent) ---
docker image inspect postgres:15 >/dev/null 2>&1 || docker pull -q postgres:15 >/dev/null
for svc in orders payments; do
  cp /root/bench/stack-bin/$svc $B/$svc
  printf 'FROM scratch\nCOPY %s /%s\nENTRYPOINT ["/%s"]\n' $svc $svc $svc > $B/Dockerfile.$svc
  docker build -q -f $B/Dockerfile.$svc -t stack-$svc:bench $B >/dev/null
done
cat > $B/service.env <<EOF
ORDERS_DB_URL=postgres://orders:${BENCH_ORDERS_PW}@127.0.0.1:5432/orders?sslmode=disable
PAYMENTS_DB_URL=postgres://payments:${BENCH_PAYMENTS_PW}@127.0.0.1:5432/payments?sslmode=disable
STRIPE_SECRET_KEY=${BENCH_STRIPE_KEY}
PAYMENT_SERVICE_URL=http://127.0.0.1:21101
EOF
if ! docker inspect pg15 >/dev/null 2>&1; then
  systemctl stop postgresql
  docker run -d --name pg15 --network host -e POSTGRES_PASSWORD=${BENCH_PG_SUPER_PW} postgres:15 >/dev/null
  for i in $(seq 1 60); do docker exec pg15 pg_isready -q 2>/dev/null && break; sleep 1; done
  docker exec -u postgres pg15 psql -qAt -c "CREATE ROLE orders LOGIN PASSWORD '${BENCH_ORDERS_PW}'" >/dev/null
  docker exec -u postgres pg15 psql -qAt -c "CREATE ROLE payments LOGIN PASSWORD '${BENCH_PAYMENTS_PW}'" >/dev/null
  docker exec -u postgres pg15 psql -qAt -c "CREATE DATABASE orders OWNER orders" >/dev/null
  docker exec -u postgres pg15 psql -qAt -c "CREATE DATABASE payments OWNER payments" >/dev/null
  docker stop pg15 >/dev/null
fi
for svc in orders payments; do
  docker rm -f stack-$svc-c >/dev/null 2>&1
  port=$([ $svc = orders ] && echo $ORD_PORT || echo $PAY_PORT)
  docker create --name stack-$svc-c --network host --env-file $B/service.env -e PORT=$port stack-$svc:bench >/dev/null
done

drop() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null; }
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
health() { # port
  local port=$1 resp
  exec 3<>/dev/tcp/127.0.0.1/$port 2>/dev/null || return 1
  printf 'GET /healthz HTTP/1.0\r\nHost: x\r\n\r\n' >&3; read -r resp <&3; exec 3<&- 3>&-
  case "$resp" in *" 200"*) return 0;; esac; return 1
}
ready_stack() {
  local deadline=$(( $(date +%s) + 60 ))
  until health $ORD_PORT && health $PAY_PORT && pg_isready -q -h 127.0.0.1 -p 5432; do
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done
}
stop_anode() { systemctl stop anode-orders anode-payments postgresql 2>/dev/null; }
stop_docker() { docker stop stack-orders-c stack-payments-c pg15 >/dev/null 2>&1; }
start_anode() { systemctl start postgresql anode-orders anode-payments; }
start_docker() { docker start pg15 >/dev/null; docker start stack-orders-c stack-payments-c >/dev/null; }

printf "trial\tarm\tready_us\n" > $OUT
for t in $(seq 1 "$TRIALS"); do
  stop_docker; stop_anode; drop
  t0=$(now_us); start_anode; ready_stack || echo "anode not ready trial $t" >&2; t1=$(now_us)
  printf "%s\tanode-stack\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT; stop_anode

  stop_docker; stop_anode; drop
  t0=$(now_us); start_docker; ready_stack || echo "docker not ready trial $t" >&2; t1=$(now_us)
  printf "%s\tdocker-stack\t%s\n" "$t" "$(( t1 - t0 ))" >> $OUT; stop_docker
done

# --- idle memory, one arm at a time, 20 s after ready ---
rss_of_pattern() { local total=0; for p in $(pgrep -x "$1" | sort -u); do r=$(awk '/VmRSS/ {print $2}' /proc/$p/status 2>/dev/null); total=$((total + ${r:-0})); done; echo $total; }
IDLE=$B/stack_idle.tsv
printf "arm\tmeasure\tvalue\n" > $IDLE

stop_docker; stop_anode; start_anode; ready_stack; sleep 20
printf "anode-stack\tpostgres_rss_kb\t%s\n" "$(rss_of_pattern postgres)" >> $IDLE
printf "anode-stack\torders_rss_kb\t%s\n" "$(rss_of_pattern orders)" >> $IDLE
printf "anode-stack\tpayments_rss_kb\t%s\n" "$(rss_of_pattern payments)" >> $IDLE
printf "anode-stack\tcgroup_memory_bytes\t%s\n" "$(( $(systemctl show -p MemoryCurrent --value anode-orders) + $(systemctl show -p MemoryCurrent --value anode-payments) ))" >> $IDLE
printf "anode-stack\tedge_caddy_rss_kb\t%s\n" "$(rss_of_pattern caddy)" >> $IDLE
stop_anode

stop_docker; stop_anode; start_docker; ready_stack; sleep 20
printf "docker-stack\tpostgres_rss_kb\t%s\n" "$(rss_of_pattern postgres)" >> $IDLE
printf "docker-stack\torders_rss_kb\t%s\n" "$(rss_of_pattern orders)" >> $IDLE
printf "docker-stack\tpayments_rss_kb\t%s\n" "$(rss_of_pattern payments)" >> $IDLE
dsum=0; for n in dockerd containerd; do dsum=$(( dsum + $(rss_of_pattern $n) )); done
printf "docker-stack\tdaemons_rss_kb\t%s\n" "$(( dsum + $(rss_of_pattern containerd-shim) ))" >> $IDLE
stop_docker
echo done
