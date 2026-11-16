#!/bin/bash
set -u
OUT=/root/bench/stack/pg_alone.tsv
printf "trial\tarm\tpg_ready_us\n" > $OUT
now_us() { local t=$EPOCHREALTIME; echo "${t/./}"; }
for t in $(seq 1 5); do
  systemctl stop postgresql; docker stop pg15 >/dev/null 2>&1; sync; echo 3 > /proc/sys/vm/drop_caches
  t0=$(now_us); systemctl start postgresql; until pg_isready -q -h 127.0.0.1 -p 5432; do :; done; t1=$(now_us)
  printf "%s\tapt-postgresql\t%s\n" $t $((t1-t0)) >> $OUT; systemctl stop postgresql
  sync; echo 3 > /proc/sys/vm/drop_caches
  t0=$(now_us); docker start pg15 >/dev/null; until pg_isready -q -h 127.0.0.1 -p 5432; do :; done; t1=$(now_us)
  printf "%s\tdocker-postgres15\t%s\n" $t $((t1-t0)) >> $OUT; docker stop pg15 >/dev/null
done
printf "--\n" >> $OUT
