#!/usr/bin/python3
# Denial probes run inside an anode-style unit. Each probe records what happened.
import ctypes, errno, json, mmap, os, socket, subprocess, time

results = {}

def attempt(name, fn):
    try:
        fn()
        results[name] = "ALLOWED"
    except OSError as e:
        results[name] = "DENIED " + errno.errorcode.get(e.errno, str(e.errno))
    except Exception as e:
        results[name] = "ERROR " + type(e).__name__ + ": " + str(e)

def write_file(path):
    def f():
        with open(path, "w") as fh:
            fh.write("x")
        os.remove(path)
    return f

def bind80():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("0.0.0.0", 80))
    s.close()

def raw_socket():
    s = socket.socket(17, 3)  # AF_PACKET, SOCK_RAW
    s.close()

def mdwe():
    m = mmap.mmap(-1, 4096, prot=mmap.PROT_READ | mmap.PROT_WRITE | mmap.PROT_EXEC)
    m.close()

def unshare_mount():
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.unshare(0x00020000) != 0:  # CLONE_NEWNS
        e = ctypes.get_errno()
        raise OSError(e, os.strerror(e))

def sudo_setuid():
    if not os.path.exists("/usr/bin/sudo"):
        raise OSError(errno.ENOENT, "no /usr/bin/sudo")
    r = subprocess.run(["/usr/bin/sudo", "-n", "true"], capture_output=True)
    if r.returncode != 0:
        raise OSError(errno.EPERM, "sudo returned %d" % r.returncode)

attempt("write /usr", write_file("/usr/anode-probe"))
attempt("write /etc", write_file("/etc/anode-probe"))
attempt("write /home", write_file("/home/anode-probe"))
attempt("write state dir (control, must be ALLOWED)", write_file(os.environ["STATE_DIRECTORY"] + "/probe-ok"))
attempt("bind :80", bind80)
attempt("raw socket AF_PACKET", raw_socket)
attempt("W+X memory (MemoryDenyWriteExecute)", mdwe)
attempt("unshare mount namespace (RestrictNamespaces)", unshare_mount)
attempt("setuid escalation via sudo", sudo_setuid)

results["uid"] = os.getuid()
with open("/proc/self/status") as fh:
    for line in fh:
        if line.startswith("CapEff:"):
            results["CapEff"] = line.split()[1]
results["visible pids in /proc (ProcSubset=pid)"] = len([p for p in os.listdir("/proc") if p.isdigit()])
results["non-pid entries in /proc"] = len([p for p in os.listdir("/proc") if not p.isdigit()])

with open(os.environ["STATE_DIRECTORY"] + "/results.json", "w") as fh:
    json.dump(results, fh, indent=2, sort_keys=True)
time.sleep(100000)
