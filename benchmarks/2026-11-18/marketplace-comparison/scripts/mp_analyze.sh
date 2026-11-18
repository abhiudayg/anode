#!/bin/bash
# Summarise one load run.  Usage: mp_analyze.sh <dir with w*.log>   (run as root on the VM)
# Log line format (from loadgen): ms status latency_us body   |   ms ERR latency_us error
D=$1
cat $D/w*.log > $D/all.txt
awk '$2=="502"{print $1}' $D/all.txt | sort -n > $D/502_ts.txt
awk '$2=="200"{print $3}' $D/all.txt | sort -n > $D/lat_ok_sorted.txt
REQ=$(wc -l < $D/all.txt)
ERR=$(awk '$2=="ERR"' $D/all.txt | wc -l)
S502=$(wc -l < $D/502_ts.txt)
S200=$(wc -l < $D/lat_ok_sorted.txt)
W=0; [ "$S502" -gt 0 ] && W=$(( $(tail -1 $D/502_ts.txt) - $(head -1 $D/502_ts.txt) ))
N=$S200
P50=$(awk -v n=$N 'NR==int(0.50*n+0.5){print; exit}' $D/lat_ok_sorted.txt)
P99=$(awk -v n=$N 'NR==int(0.99*n+0.5){print; exit}' $D/lat_ok_sorted.txt)
printf "requests\t%s\nok200\t%s\nerr\t%s\n502\t%s\n502_window_ms\t%s\np50_us\t%s\np99_us\t%s\n" $REQ $S200 $ERR $S502 $W $P50 $P99 > $D/summary.tsv
rm -f $D/all.txt
cat $D/summary.tsv
