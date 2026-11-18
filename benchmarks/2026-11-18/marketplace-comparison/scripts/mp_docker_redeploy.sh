#!/bin/bash
# Docker arm redeploy under load, run as root on the VM.
# Build and create every new container first (no port is held yet), then the switch is three batched docker commands:
# stop all old containers, remove them, rename the new ones, start them all.  The gap is the switch, nothing else.
set -u
C=/root/mpcmp; REL=/var/lib/anode/releases/$(ls -t /var/lib/anode/releases | grep -v sha256 | head -1)
SVCS=$(cut -f1 $C/routes.tsv | sort -u)
echo "release=$(basename $REL)"
for s in $SVCS; do
  cp $REL/$s $C/img-$s/$s
  docker build -q -t mp-$s:next $C/img-$s >/dev/null || { echo "build failed: $s" >&2; exit 1; }
  docker rm -f mp-$s-n >/dev/null 2>&1
  docker create --name mp-$s-n --network host --env-file $C/env/$s.env mp-$s:next >/dev/null
done
OLD=""; NEW=""; for s in $SVCS; do OLD="$OLD mp-$s-c"; NEW="$NEW mp-$s-n"; done
echo "prepared_us=$EPOCHREALTIME"
docker stop $OLD >/dev/null                        # switch starts
docker rm $OLD >/dev/null
for s in $SVCS; do docker rename mp-$s-n mp-$s-c; done
docker start $(for s in $SVCS; do echo mp-$s-c; done) >/dev/null
echo "switched_us=$EPOCHREALTIME"                  # switch ends
