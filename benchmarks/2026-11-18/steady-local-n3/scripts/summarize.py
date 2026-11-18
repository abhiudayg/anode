import glob, os, re, statistics, sys
root = sys.argv[1]
rows = {}
for f in sorted(glob.glob(os.path.join(root, 'rate*-rep*-*.txt'))):
    name = os.path.basename(f)[:-4]
    m = re.match(r'rate(\d+)-rep(\d+)-(\w+)', name)
    rate, rep, arm = m.group(1), m.group(2), m.group(3)
    vals = {}
    for line in open(f):
        parts = line.split()
        if len(parts) == 2:
            vals[parts[0]] = parts[1]
    rows.setdefault((rate, arm), []).append((rep, vals))
for (rate, arm), runs in sorted(rows.items(), key=lambda x: (int(x[0][0]), x[0][1])):
    def col(k):
        out = []
        for _, v in runs:
            try: out.append(float(v[k]))
            except (KeyError, ValueError): pass
        return out
    p50, p99, p999 = col('p50_ms'), col('p99_ms'), col('p999_ms')
    errs = [int(v['sent']) - int(v['status_200']) if 'sent' in v and 'status_200' in v else '-' for _, v in runs]
    f = lambda xs: f"{min(xs):.2f}-{max(xs):.2f} (median {statistics.median(xs):.2f})" if xs else "-"
    print(f"rate={rate:>3} arm={arm:<7} n={len(runs)} p50 {f(p50)} | p99 {f(p99)} | p999 {f(p999)} | errors {errs}")
