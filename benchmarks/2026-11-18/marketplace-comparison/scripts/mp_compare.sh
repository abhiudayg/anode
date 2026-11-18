#!/bin/bash
# Marketplace anode vs Docker, one protocol for both arms.  Run from the Mac.
#   Usage: mp_compare.sh <first-arm> <second-arm>      e.g. mp_compare.sh anode docker  then  mp_compare.sh docker anode
# Per arm: functional parity (85 routes), cold start x5, idle memory (cgroup + RSS), then a 15-minute load run
# (50 closed-loop clients on /healthz via Caddy) with a whole-project redeploy at minute 3.
# Results land in $OUT on the VM under /root/mpcmp/<run>/<arm>/ and are copied back to $LOCAL.
set -eu
ROOT=$(cd "$(dirname "$0")" && pwd)
VM=anode-mp-bench; ZONE=us-central1-a; IP=34.30.41.59
RUN=${RUN:-$(date -u +%Y%m%dT%H%M%SZ)}
LOCAL=${LOCAL:-$ROOT/results/$RUN}
DUR=${DUR:-15m}; REDEPLOY_AT=${REDEPLOY_AT:-180}
APP=${APP:-/Volumes/Seagate/developer/personal/anode/examples/marketplace}
ANODE=${ANODE:-$ROOT/anode}          # built from the repo: go build -o $ROOT/anode ./cmd/anode
SSH() { gcloud compute ssh $VM --zone=$ZONE --quiet --command "$1"; }
mkdir -p $LOCAL

# 0. push the scripts (idempotent)
gcloud compute scp $ROOT/routes.tsv $ROOT/mp_arm.sh $ROOT/mp_docker_redeploy.sh $ROOT/mp_analyze.sh $ROOT/loadgen_linux $VM:/tmp/ --zone=$ZONE --quiet >/dev/null
SSH "sudo mkdir -p /root/mpcmp/$RUN && sudo cp /tmp/routes.tsv /tmp/mp_arm.sh /tmp/mp_docker_redeploy.sh /tmp/mp_analyze.sh /root/mpcmp/ && sudo cp /tmp/loadgen_linux /root/mpcmp/loadgen && sudo sh -c 'chmod +x /root/mpcmp/*.sh /root/mpcmp/loadgen'"

run_arm() { local arm=$1; local D=/root/mpcmp/$RUN/$arm
  echo "== $arm: functional, cold start, idle"
  SSH "sudo sh -c 'mkdir -p $D; TRIALS=5 bash /root/mpcmp/mp_arm.sh $arm > $D/arm.log 2>&1; echo \$? > $D/arm.rc'"
  SSH "sudo cat $D/arm.rc" | grep -qx 0 || { echo "$arm arm failed, see $D/arm.log on the VM"; exit 1; }

  echo "== $arm: load $DUR, redeploy at ${REDEPLOY_AT}s"
  SSH "sudo sh -c 'mkdir -p $D/load && nohup /root/mpcmp/loadgen -n 50 -d $DUR -url http://127.0.0.1/healthz -host $IP -out $D/load > $D/load.log 2>&1 & echo \$! > $D/load.pid'"
  sleep "$REDEPLOY_AT"
  local t0 t1
  if [ "$arm" = anode ]; then
    t0=$(date -u +%s%3N); (cd $APP && $ANODE deploy anode@$IP . --plain-http > $LOCAL/redeploy_anode.log 2>&1); echo "EXIT $?" >> $LOCAL/redeploy_anode.log
    t1=$(date -u +%s%3N); echo "$t0 $t1" > $LOCAL/redeploy_anode.times
    grep -q "^EXIT 0" $LOCAL/redeploy_anode.log || { echo "anode redeploy failed, see $LOCAL/redeploy_anode.log"; exit 1; }
  else
    SSH "sudo sh -c 'bash /root/mpcmp/mp_docker_redeploy.sh > $D/redeploy.log 2>&1'"
    SSH "sudo cat $D/redeploy.log" > $LOCAL/redeploy_docker.log
  fi
  echo "== $arm: waiting for the load run"
  until SSH "sudo sh -c '! kill -0 \$(cat $D/load.pid) 2>/dev/null'" >/dev/null 2>&1; do sleep 30; done
  SSH "sudo sh -c 'bash /root/mpcmp/mp_analyze.sh $D/load'" > $LOCAL/$arm.load.summary.tsv
  # the arm's cold/idle/smoke files live in /root/mpcmp/<arm>; the load and redeploy logs in the run folder
  SSH "sudo sh -c 'cd /root/mpcmp && tar czf /tmp/$RUN-$arm.tgz $RUN/$arm $arm'"
  gcloud compute scp $VM:/tmp/$RUN-$arm.tgz $LOCAL/ --zone=$ZONE --quiet >/dev/null
  tar xzf $LOCAL/$RUN-$arm.tgz -C $LOCAL && rm $LOCAL/$RUN-$arm.tgz
  echo "== $arm done: $(cat $LOCAL/$arm.load.summary.tsv | tr '\n' ' ')"
}
run_arm "$1"
[ -n "${2:-}" ] && run_arm "$2"
echo "results in $LOCAL"
