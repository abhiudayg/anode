#!/bin/bash
# LLM-judge baseline: a model reads a real test log and returns PASS or FAIL.
# Measured per call: wall time, reported tokens (input, cache creation, cache read, output), cost.
# Usage: judge_bench.sh <log-file> <trials> <results-tsv>
set -u
LOG="$1"; TRIALS="$2"; OUT="$3"
PROMPT_HEAD="Below is the output of a test run after a code change. Answer with exactly one word: PASS if every test passed, otherwise FAIL."
printf "trial\twall_ms\tresult\tinput_tokens\tcache_create_tokens\tcache_read_tokens\toutput_tokens\tcost_usd\n" > "$OUT"
for t in $(seq 1 "$TRIALS"); do
  PROMPT="$PROMPT_HEAD

$(cat "$LOG")"
  t0=$(date +%s%N)
  json=$(claude -p "$PROMPT" --system-prompt "You are a test result judge." --tools "" --no-session-persistence --output-format json 2>/dev/null)
  t1=$(date +%s%N)
  row=$(echo "$json" | jq -r '[(.result // "ERROR"), (.usage.input_tokens // 0), (.usage.cache_creation_input_tokens // 0), (.usage.cache_read_input_tokens // 0), (.usage.output_tokens // 0), (.total_cost_usd // 0)] | @tsv')
  printf "%s\t%s\t%s\n" "$t" "$(( (t1 - t0) / 1000000 ))" "$row" >> "$OUT"
done
echo done
