#!/bin/bash
# Marketplace comparison, one arm, run as root on the VM.  Usage: mp_arm.sh anode|docker
#   Same protocol for both arms: start the 32 services, check every registered route, cold start x TRIALS, idle memory.
#   The 32 store containers (28 anode-managed, 4 hand-started) keep running in both arms.
#   Rules: a trial whose drop_caches fails or whose services are not ready is retried, never written as a sample.
set -u
ARM=$1
C=/root/mpcmp; B=$C/$ARM; mkdir -p $B
TRIALS=${TRIALS:-5}
MAX_RETRY=${MAX_RETRY:-2}
REL=/var/lib/anode/releases/$(ls -t /var/lib/anode/releases | grep -v sha256 | head -1)
UNITS=$(systemctl list-unit-files 'anode-*.service' --no-legend | awk '{print $1}' | sed 's/\.service$//')
SVCS=$(cut -f1 $C/routes.tsv | sort -u)
N=$(echo $SVCS | wc -w)
PORTS=""; : > $B/ports.tsv
for s in $SVCS; do p=$(systemctl show -p Environment --value anode-$s.service | tr ' ' '\n' | grep '^PORT=' | cut -d= -f2); printf "%s\t%s\n" $s $p >> $B/ports.tsv; PORTS="$PORTS $p"; done
port_of() { awk -v s=$1 '$1==s{print $2}' $B/ports.tsv; }
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
rss() { awk '/VmRSS/ {print $2}' /proc/$1/status 2>/dev/null; }
# cgroup v2 memory.current in bytes for one service: the unit's cgroup, or the container's scope
cg_bytes() { local s=$1
  if [ "$ARM" = anode ]; then systemctl show -p MemoryCurrent --value anode-$s.service
  else local id; id=$(docker inspect -f '{{.Id}}' mp-$s-c); cat /sys/fs/cgroup/system.slice/docker-$id.scope/memory.current 2>/dev/null; fi; }

# env files for the docker arm: the same EnvironmentFiles and Environment the units use
mk_env() { local svc=$1; local envf=$C/env/$svc.env; mkdir -p $C/env; : > $envf
  for f in $(systemctl show -p EnvironmentFiles --value anode-$svc.service | awk '{print $1}' | grep '^/'); do cat "$f" >> $envf; done
  systemctl show -p Environment --value anode-$svc.service | tr ' ' '\n' | grep '=' >> $envf; }
# images and containers are built once, before any timed step
prepare() {
  if [ "$ARM" = anode ]; then for s in $SVCS; do docker stop mp-$s-c >/dev/null 2>&1; done
  else
    systemctl stop $UNITS
    for s in $SVCS; do mk_env $s; mkdir -p $C/img-$s && cp $REL/$s $C/img-$s/$s
      printf 'FROM scratch\nCOPY %s /%s\nENTRYPOINT ["/%s"]\n' $s $s $s > $C/img-$s/Dockerfile
      docker build -q -t mp-$s:cmp $C/img-$s >/dev/null; docker rm -f mp-$s-c >/dev/null 2>&1
      docker create --name mp-$s-c --network host --env-file $C/env/$s.env mp-$s:cmp >/dev/null
    done
  fi; }
start_arm() {
  if [ "$ARM" = anode ]; then systemctl start $UNITS
  else for s in $SVCS; do docker start mp-$s-c >/dev/null; done; fi; }
stop_arm() {
  if [ "$ARM" = anode ]; then systemctl stop $UNITS; else for s in $SVCS; do docker stop mp-$s-c >/dev/null 2>&1; done; fi; }
ready() { local deadline=$(( $(date +%s) + 240 )) ok code p
  while :; do ok=0
    for p in $PORTS; do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://127.0.0.1:$p/healthz); [ "$code" = 200 ] && ok=$((ok+1)); done
    [ $ok -ge $N ] && return 0; [ "$(date +%s)" -lt "$deadline" ] || { echo "ready timeout ok=$ok" >&2; return 1; }
  done; }
# drop the page cache; fail loudly if the kernel did not accept it
drop_caches() { sync; echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || { echo "drop_caches failed" >&2; return 1; }; sleep 2; }

prepare
# 1. functional parity: every registered route, same request in both arms
start_arm; ready || { echo "arm $ARM not ready before smoke" >&2; exit 1; }
: > $B/smoke.tsv
while IFS=$'\t' read -r svc m path; do
  p=$(port_of $svc); pp=$(echo "$path" | sed -E 's/\{[^}]*\}/x/g')
  case $m in POST|PUT|PATCH|DELETE) body='-H Content-Type:application/json -d {}';; *) body='';; esac
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X $m $body http://127.0.0.1:$p$pp)
  printf "%s\t%s\t%s\t%s\n" $svc $m "$pp" $code >> $B/smoke.tsv
done < $C/routes.tsv

# 2. cold start, stores running, 32 services started together.  Failed attempts are logged, not sampled.
printf "trial\tready_us\n" > $B/coldstart.tsv; : > $B/coldstart_failed.log
t=0
while [ $t -lt $TRIALS ]; do
  t=$((t+1)); ok=0
  for attempt in $(seq 1 $((MAX_RETRY+1))); do
    stop_arm
    drop_caches || { echo "trial $t attempt $attempt: drop failed" >> $B/coldstart_failed.log; continue; }
    t0=$(now_us); start_arm
    if ready; then t1=$(now_us); printf "%s\t%s\n" $t $((t1-t0)) >> $B/coldstart.tsv; ok=1; break
    else echo "trial $t attempt $attempt: not ready" >> $B/coldstart_failed.log; fi
  done
  [ $ok = 1 ] || { echo "trial $t: no valid attempt, stopping" >&2; exit 1; }
done

# 3. idle memory, 20 s after ready.  Services: cgroup bytes (memory.current) and RSS.  Daemons: reported separately.
sleep 20
svc_cg=0; svc_rss=0
for s in $SVCS; do b=$(cg_bytes $s); svc_cg=$((svc_cg + ${b:-0})); done
if [ "$ARM" = anode ]; then for u in $UNITS; do pid=$(systemctl show -p MainPID --value $u); svc_rss=$((svc_rss + $(rss $pid))); done
else for s in $SVCS; do pid=$(docker inspect -f '{{.State.Pid}}' mp-$s-c); svc_rss=$((svc_rss + $(rss $pid))); done; fi
d=0; for n in dockerd containerd containerd-shim; do for p in $(pgrep -x $n | sort -u); do d=$((d + $(rss $p))); done; done
{ printf "services_cgroup_bytes\t%s\n" $svc_cg; printf "services_rss_kb\t%s\n" $svc_rss
  printf "service_count\t%s\n" $N; printf "daemon_rss_kb\t%s\n" $d
  printf "running_store_containers\t%s\n" "$(docker ps --format '{{.Names}}' | grep -vc '^mp-')"; } > $B/idle.tsv
echo done
