#!/bin/bash
# tekmor overhead on a real project: direct `pnpm -r --if-present test` vs `tekmor verify -- <same command>`.
# Usage: llm_bench.sh <project-dir> <trials> <results-tsv>
set -u
cd "$1" || exit 1
TRIALS="$2"; OUT="$3"
TIMEFORMAT=%R
printf "arm\ttrial\treal_s\texit\n" > "$OUT"
for t in $(seq 1 "$TRIALS"); do
  s=$( { time pnpm -r --if-present test >/dev/null 2>&1; } 2>&1 ); rc=$?
  printf "direct\t%s\t%s\t%s\n" "$t" "$s" "$rc" >> "$OUT"
  s=$( { time tekmor verify -- pnpm -r --if-present test >/dev/null 2>&1; } 2>&1 ); rc=$?
  printf "tekmor\t%s\t%s\t%s\n" "$t" "$s" "$rc" >> "$OUT"
done
echo done
