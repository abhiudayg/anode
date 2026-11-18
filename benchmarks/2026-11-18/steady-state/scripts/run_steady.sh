#!/bin/bash
# Steady-state, three arms, same route, same Caddy edge. Run from the Mac.
set -u
S=$(cd "$(dirname "$0")" && pwd)
OUT=$S/results; mkdir -p $OUT
TGT=anode-mp-bench; LG=anode-loadgen; ZONE=us-central1-a
URL=http://10.128.0.8/v1/orders/steady-1
PORT=21059
TR() { timeout 150 gcloud compute ssh $TGT --zone=$ZONE --quiet --command "sudo sh -c '$1'" 2>/dev/null </dev/null; }
LGR() { timeout 150 gcloud compute ssh $LG --zone=$ZONE --quiet --command "$1" 2>>$OUT/ssh_errors.log </dev/null; }
switch() {
  case $1 in
    anode) TR "systemctl stop bare-orders; docker stop mp-orders-c >/dev/null 2>&1; systemctl start anode-orders" ;;
    bare)  TR "systemctl stop anode-orders; docker stop mp-orders-c >/dev/null 2>&1; systemctl start bare-orders" ;;
    docker) TR "systemctl stop anode-orders bare-orders; docker start mp-orders-c >/dev/null" ;;
  esac
  for i in $(seq 1 60); do c=$(TR "curl -s -m 1 -o /dev/null -w %{http_code} http://127.0.0.1:$PORT/healthz" || true); [ "$c" = 200 ] && break; sleep 1; done
}
pid_of() {
  case $1 in
    anode) TR "systemctl show -p MainPID --value anode-orders" ;;
    bare) TR "systemctl show -p MainPID --value bare-orders" ;;
    docker) TR "docker inspect -f '{{.State.Pid}}' mp-orders-c" ;;
  esac
}
cpu_ticks() { TR "cat /proc/$1/stat" | python3 -c "import sys; f=sys.stdin.read().rsplit(')',1)[1].split(); print(int(f[11])+int(f[12]))"; }
rss_kb() { TR "grep VmRSS /proc/$1/status" | awk '{print $2}'; }
for arm in ${ARMS:-anode bare docker}; do
  echo "== arm $arm"; switch $arm
  PID=$(pid_of $arm); echo "pid=$PID"
  for rate in 100 500 1000; do
    t0=$(cpu_ticks $PID); w0=$(date +%s.%N)
    LGR "/tmp/gen -url $URL -host 34.30.41.59 -rate $rate -warm 10s -d 60s" > $OUT/${arm}_${rate}.tsv
    w1=$(date +%s.%N); t1=$(cpu_ticks $PID)
    rss=$(rss_kb $PID)
    cpu=$(python3 -c "print('%.1f' % (( $t1-$t0 ) / 100.0 / ( $w1-$w0 ) * 100))")
    printf "service_cpu_pct\t%s\nservice_rss_kb\t%s\n" $cpu $rss >> $OUT/${arm}_${rate}.tsv
    echo "$arm $rate done cpu=${cpu}% rss=${rss}kB"
  done
done
echo DONE
