#!/bin/bash
# Anode `inspect` benchmark: wall time, peak RSS, detected counts, lockfile determinism.
# Usage: anode_bench.sh <anode-binary> <fixtures-dir> <trials> <results-tsv>
set -u
ANODE="$1"; FIX="$2"; TRIALS="$3"; OUT="$4"
printf "fixture\ttrial\treal_s\tpeak_rss_mb\tservices\tstore_resources\tlock_sha256\n" > "$OUT"
for f in sample-shop storefront retail-platform marketplace; do
  for t in $(seq 1 "$TRIALS"); do
    dir="$FIX/$f"
    rm -f "$dir/anode.lock.json"
    tf="$dir.time"
    /usr/bin/time -l -o "$tf" "$ANODE" inspect "$dir" >/dev/null 2>&1
    real=$(awk '/ real/ {print $1; exit}' "$tf")
    rss=$(awk '/maximum resident set size/ {print $1; exit}' "$tf")
    rss_mb=$(awk -v r="$rss" 'BEGIN{printf "%.1f", r/1048576}')
    svc=$(jq '.services|length' "$dir/anode.lock.json")
    res=$(jq '.resources|length' "$dir/anode.lock.json")
    sha=$(shasum -a 256 "$dir/anode.lock.json" | cut -c1-16)
    printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\n" "$f" "$t" "$real" "$rss_mb" "$svc" "$res" "$sha" >> "$OUT"
  done
done
echo "done: $OUT"
