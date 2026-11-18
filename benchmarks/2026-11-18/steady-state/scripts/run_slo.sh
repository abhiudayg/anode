#!/bin/bash
# SLO check on e2-standard-2: orders footprint only, 500 RPS, 60 s per arm. Each arm must hold p99 <= 10 ms with 0 errors.
S=$(cd "$(dirname "$0")" && pwd); OUT=$S/slo; mkdir -p $OUT
URL=http://10.128.0.8/v1/orders/steady-1; HOSTH=34.30.41.59
T() { timeout 150 gcloud compute ssh anode-mp-bench --zone=us-central1-a --quiet --command "sudo sh -c '$1'" </dev/null 2>/dev/null; }
L() { timeout 170 gcloud compute ssh anode-loadgen --zone=us-central1-a --quiet --command "$1" </dev/null 2>>$OUT/ssh_errors.log; }
switch() {
  case $1 in
    anode) T "systemctl stop bare-orders; docker stop mp-orders-c >/dev/null 2>&1; systemctl start anode-orders" ;;
    bare) T "systemctl stop anode-orders; docker stop mp-orders-c >/dev/null 2>&1; systemctl start bare-orders" ;;
    docker) T "systemctl stop anode-orders bare-orders; docker start mp-orders-c >/dev/null" ;;
  esac
  for i in $(seq 1 30); do c=$(T "curl -s -m 1 -o /dev/null -w %{http_code} http://127.0.0.1:21059/healthz"); [ "$c" = 200 ] && break; sleep 2; done
  echo "$1 healthz=$c"
}
for arm in ${ARMS:-anode bare docker}; do
  switch $arm
  L "/tmp/gen -url $URL -host $HOSTH -rate 500 -warm 10s -d 60s" > $OUT/${arm}_500.tsv
  p99=$(awk -F'\t' '$1=="p99_ms"{print $2}' $OUT/${arm}_500.tsv); err=$(awk -F'\t' '$1=="status_err"{print $2}' $OUT/${arm}_500.tsv); ok=$(awk -F'\t' '$1=="ok_200"{print $2}' $OUT/${arm}_500.tsv)
  echo "$arm p99=$p99 errors=${err:-0} ok200=$ok" >> $OUT/summary.txt
done
echo DONE >> $OUT/summary.txt
