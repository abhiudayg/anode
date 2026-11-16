#!/bin/bash
# retail-platform on anode: 12 service units restarted together; stores stay running.
# Ready = 11 HTTP services answer 200 on /healthz and ledger accepts TCP (it has no HTTP server).
set -u
OUT=/tmp/rp-cold.tsv
SVCS="analytics apigateway auditlog auth catalog fulfillment inventory ledger notifications orders payments userprofile"
PORTS=$(seq 21040 21051)
printf "trial\tready_us\n" > $OUT
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
ready() {
  local deadline=$(( $(date +%s) + 120 )) ok code p
  while :; do
    ok=0
    for p in $PORTS; do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://127.0.0.1:$p/healthz)
      [ "$code" = 200 ] && ok=$((ok+1))
    done
    # ledger has no HTTP server: count it ready when its port accepts TCP
    timeout 1 bash -c 'exec 3<>/dev/tcp/127.0.0.1/21047' 2>/dev/null && ledger=1 || ledger=0
    [ $ok -ge 11 ] && [ $ledger = 1 ] && return 0
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done
}
for t in $(seq 1 ${TRIALS:-5}); do
  for s in $SVCS; do sudo systemctl stop anode-$s; done
  sync; echo 3 | sudo tee /proc/sys/vm/drop_caches >/dev/null
  t0=$(now_us)
  for s in $SVCS; do sudo systemctl start anode-$s; done
  ready || echo "not ready trial $t" >&2
  t1=$(now_us)
  printf "%s\t%s\n" $t $((t1-t0)) >> $OUT
done
echo done
