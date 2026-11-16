#!/bin/bash
# retail-platform, Docker arm: the same release binaries and the same environment as the anode units,
# run as containers (host networking). Stores stay as anode runs them. Runs on the VM as root.
set -u
B=/root/rpdocker
OUT=$B/coldstart.tsv
IDLE=$B/idle.tsv
TRIALS=${TRIALS:-5}
SVCS="analytics apigateway auditlog auth catalog fulfillment inventory ledger notifications orders payments userprofile"
REL=/var/lib/anode/releases/$(ls -t /var/lib/anode/releases | grep -v sha256 | head -1)
mkdir -p $B

for svc in $SVCS; do
  unit=anode-$svc
  envf=$B/$svc.env
  : > $envf
  # secrets: the EnvironmentFile(s) the unit reads
  for f in $(systemctl show -p EnvironmentFiles --value $unit | awk '{print $1}' | grep '^/'); do cat "$f" >> $envf; done
  # inline settings (service URLs, PORT)
  systemctl show -p Environment --value $unit | tr ' ' '\n' | grep '=' >> $envf
  grep -q '^PORT=' $envf || { echo "no PORT for $svc" >&2; }
  mkdir -p $B/img-$svc && cp $REL/$svc $B/img-$svc/$svc
  printf 'FROM scratch\nCOPY %s /%s\nENTRYPOINT ["/%s"]\n' $svc $svc $svc > $B/img-$svc/Dockerfile
  docker build -q -t rp-$svc:docker $B/img-$svc >/dev/null
  docker rm -f rp-$svc-c >/dev/null 2>&1
  docker create --name rp-$svc-c --network host --env-file $envf rp-$svc:docker >/dev/null
done

units=""; for s in $SVCS; do units="$units anode-$s"; done
conts=""; for s in $SVCS; do conts="$conts rp-$s-c"; done
PORTS=$(seq 21040 21051)

ready() {
  local deadline=$(( $(date +%s) + 120 )) ok code p ledger
  while :; do
    ok=0
    for p in $PORTS; do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://127.0.0.1:$p/healthz); [ "$code" = 200 ] && ok=$((ok+1)); done
    timeout 1 bash -c 'exec 3<>/dev/tcp/127.0.0.1/21047' 2>/dev/null && ledger=1 || ledger=0
    [ $ok -ge 11 ] && [ $ledger = 1 ] && return 0
    [ "$(date +%s)" -lt "$deadline" ] || return 1
  done
}
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
rss() { awk '/VmRSS/ {print $2}' /proc/$1/status 2>/dev/null; }
daemons() { local d=0; for n in dockerd containerd containerd-shim; do for p in $(pgrep -x $n | sort -u); do d=$((d + $(rss $p))); done; done; echo $d; }

printf "trial\tready_us\n" > $OUT
for t in $(seq 1 $TRIALS); do
  systemctl stop $units; docker stop $conts >/dev/null 2>&1
  sync; echo 3 > /proc/sys/vm/drop_caches
  t0=$(now_us); docker start $conts >/dev/null; ready || echo "not ready $t" >&2; t1=$(now_us)
  printf "%s\t%s\n" $t $((t1-t0)) >> $OUT
  docker stop $conts >/dev/null
done

: > $IDLE
docker start $conts >/dev/null; ready; sleep 20
svc=0; for s in $SVCS; do pid=$(docker inspect -f '{{.State.Pid}}' rp-$s-c); svc=$((svc + $(rss $pid))); done
printf "docker\tservices_rss_kb\t%s\n" $svc >> $IDLE
printf "docker\tdaemons_rss_kb_with_service_containers\t%s\n" "$(daemons)" >> $IDLE
docker stop $conts >/dev/null
echo done
