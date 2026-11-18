#!/bin/bash
# Mac side. Each arm: /slow1500 at 20 RPS, 25 s measured after 3 s warm-up, SIGTERM 8 s into the measured window.
set -u
OUT="/private/tmp/claude-501/-Volumes-Seagate-developer-personal-anode/9caf140c-e476-4a8f-8f45-5897796e9037/scratchpad/wt-drain/benchmarks/2026-11-18/drain-2x2/results"
LG="/private/tmp/claude-501/-Volumes-Seagate-developer-personal-anode/9caf140c-e476-4a8f-8f45-5897796e9037/scratchpad/loadgen_open"
arm_port() { case "$1" in plain-noretry) echo 8090;; plain-retry) echo 8091;; drain-noretry) echo 8092;; drain-retry) echo 8093;; esac; }
arm_unit() { case "$1" in plain-*) echo anode-plain.service;; drain-*) echo anode-drain.service;; esac; }
for rep in 1 2 3; do
  for arm in plain-noretry plain-retry drain-noretry drain-retry; do
    port=$(arm_port $arm); unit=$(arm_unit $arm)
    for i in $(seq 1 30); do curl -s -m 2 -o /dev/null http://anode-vm.orb.local:$port/healthz && break; sleep 1; done
    f="$OUT/rep${rep}-${arm}.txt"
    "$LG" -url "http://anode-vm.orb.local:$port/slow1500" -rate 20 -d 25s -warm 3s -conns 256 > "$f" 2>&1 &
    lg=$!
    sleep 11
    orb -m anode-vm sudo -n systemctl kill -s TERM "$unit"
    wait $lg
    echo "done rep=$rep arm=$arm: $(grep -E '^(status_|sent)' "$f" | tr '\n' ' ')"
  done
done
echo DRAIN_DONE
