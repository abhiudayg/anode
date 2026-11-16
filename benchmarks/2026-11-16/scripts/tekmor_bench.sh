#!/bin/bash
# Tekmor overhead benchmark: direct `go test -count=1 ./...` vs `tekmor verify -- ...` on the same fixture.
# Usage: tekmor_bench.sh <fixture-dir> <trials> <results-tsv>
set -u
R="$1"; TRIALS="$2"; OUT="$3"
cd "$R" || exit 1
TIMEFORMAT=%R
printf "arm\ttrial\treal_s\texit\n" > "$OUT"
for t in $(seq 1 "$TRIALS"); do
  s=$( { time go test -count=1 ./... >/dev/null 2>&1; echo $? >/dev/null; } 2>&1 ); rc=$?
  printf "direct\t%s\t%s\t%s\n" "$t" "$s" "$rc" >> "$OUT"
  s=$( { time tekmor verify -- go test -count=1 ./... >/dev/null 2>&1; } 2>&1 ); rc=$?
  printf "tekmor\t%s\t%s\t%s\n" "$t" "$s" "$rc" >> "$OUT"
done
echo "done: $OUT"
