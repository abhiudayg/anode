# Port-collision test: N copies of a project under `anode dev`, all started together.
# Measures: distinct service ports, per-copy time until every service in the copy answers /healthz 200, memory.
import os, re, subprocess, sys, time, urllib.request, glob
N = int(os.environ.get("N", "10"))
HERE = os.path.dirname(os.path.abspath(__file__))
ANODE = os.path.join(HERE, "anode")
procs = []
t0 = time.time()
for i in range(1, N + 1):
    d = os.path.join(HERE, f"c{i}")
    log = open(os.path.join(HERE, f"dev_c{i}.log"), "w")
    procs.append(subprocess.Popen([ANODE, "dev"], cwd=d, stdout=log, stderr=subprocess.STDOUT, start_new_session=True))
ready = {}
ports_of = {}
deadline = t0 + 300
while len(ready) < N and time.time() < deadline:
    for i in range(1, N + 1):
        if i in ready: continue
        text = open(os.path.join(HERE, f"dev_c{i}.log")).read()
        ps = re.findall(r"running on :(\d+)", text)
        if len(ps) < 2: continue
        ports_of[i] = ps
        ok = True
        for p in ps:
            try:
                ok = ok and urllib.request.urlopen(f"http://127.0.0.1:{p}/healthz", timeout=1).status == 200
            except Exception:
                ok = False
        if ok: ready[i] = time.time() - t0
    time.sleep(0.1)
all_ports = [p for i in ports_of for p in ports_of[i]]
with open(os.path.join(HERE, "ready.tsv"), "w") as f:
    for i in range(1, N + 1):
        f.write(f"c{i}\t{ready[i]*1000:.0f}\t{' '.join(ports_of.get(i, []))}\n" if i in ready else f"c{i}\tTIMEOUT\t\n")
    f.write(f"summary\tcopies_ready={len(ready)}/{N}\tports={len(all_ports)}\tdistinct={len(set(all_ports))}\tall_ready_ms={max(ready.values())*1000:.0f}\n" if ready else "summary\tnone ready\n")
# memory: RSS of every anode/service process started by this test
rss = 0
out = subprocess.run(["ps", "-axo", "rss=,command="], capture_output=True, text=True).stdout
for line in out.splitlines():
    if "anode dev" in line or re.search(r"/(orders|payments)\s*$", line) or "/c" in line and "/anode" in line:
        rss += int(line.split()[0])
with open(os.path.join(HERE, "memory.tsv"), "w") as f:
    f.write(f"dev_and_service_rss_mb\t{rss/1024:.0f}\n")
print("done")
