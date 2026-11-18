#!/bin/bash
# Mac side: runs the loadgen against each arm, rotating the order per repetition.
set -u
S="$(cd "$(dirname "$0")/../../../steady-state/scripts" && pwd)"
OUT="$1"
LOADGEN="${LOADGEN:-$S/loadgen_open}"
mkdir -p "$OUT"
url_for() {
  case "$1" in
    direct) echo "http://anode-vm.orb.local:9020/healthz" ;;
    anode)  echo "http://anode-vm.orb.local:8080/healthz" ;;
    bare)   echo "http://anode-vm.orb.local:8081/healthz" ;;
  esac
}
rotation() {
  case "$1" in
    1) echo "direct anode bare" ;;
    2) echo "anode bare direct" ;;
    3) echo "bare direct anode" ;;
  esac
}
for rate in 100 500; do
  for rep in 1 2 3; do
    for arm in $(rotation $rep); do
      f="$OUT/rate${rate}-rep${rep}-${arm}.txt"
      "$LOADGEN" -url "$(url_for $arm)" -rate "$rate" -d 60s -warm 10s -conns 256 > "$f" 2>&1
      echo "done rate=$rate rep=$rep arm=$arm"
    done
  done
done
echo ALL_DONE
