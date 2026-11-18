#!/bin/bash
# For each pinned repo: shallow-clone at the pinned SHA, run anode inspect, record the outcome.
set -u
ROOT="${ROOT:?set ROOT to a directory on a disk with space}"
export GOMODCACHE=$ROOT/modcache GOPATH=$ROOT/gopath GOFLAGS=-mod=mod
mkdir -p $ROOT/src $ROOT/out
while IFS=$'\t' read -r repo sha rest; do
  name=${repo//\//__}
  dir=$ROOT/src/$name
  if [ ! -d "$dir/.git" ]; then
    mkdir -p "$dir" && git -C "$dir" init -q && git -C "$dir" remote add origin "https://github.com/$repo.git"
  fi
  if ! git -C "$dir" fetch -q --depth 1 origin "$sha" 2>$ROOT/out/$name.clone.err; then
    echo -e "$repo\tCLONE_FAILED" >> $ROOT/out/status.tsv; continue
  fi
  git -C "$dir" checkout -q FETCH_HEAD
  start=$(date +%s)
  (cd "$dir" && timeout 900 /private/tmp/claude-501/-Volumes-Seagate-developer-personal-anode/9caf140c-e476-4a8f-8f45-5897796e9037/scratchpad/anode-corpus inspect . > $ROOT/out/$name.inspect.log 2>&1)
  rc=$?
  elapsed=$(( $(date +%s) - start ))
  echo -e "$repo\t$sha\trc=$rc\t${elapsed}s" >> $ROOT/out/status.tsv
  echo "done $repo rc=$rc ${elapsed}s"
done < pins.tsv
echo CORPUS_DONE
