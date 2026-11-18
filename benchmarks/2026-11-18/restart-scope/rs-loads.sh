#!/bin/bash
# Usage: rs-loads.sh <label> <seconds>. Starts one open-loop load per service, waits for all.
label=$1; dur=$2
pids=()
for i in 01 02 03 04 05 06 07 08 09 10 11 12; do
  if [ $i = 01 ]; then path=/healthz; else path=/svc$i/healthz; fi
  /private/tmp/claude-501/-Volumes-Seagate-developer-personal-anode/9caf140c-e476-4a8f-8f45-5897796e9037/scratchpad/loadgen_open2 -url "http://anode-vm.orb.local$path" -host anode-vm.orb.local -rate 10 -d ${dur}s -warm 0s -timeout 5s > "/Volumes/Seagate/anode-restart-scope/out/$label-svc$i.txt" 2>&1 &
  pids+=($!)
done
for p in "${pids[@]}"; do wait $p; done
echo "LOADS_DONE $label"
