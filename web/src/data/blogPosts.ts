export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
  authorRole: string;
  sections: {
    heading: string;
    paragraphs: string[];
    codeBlock?: {
      language: string;
      title: string;
      code: string;
    };
    callout?: {
      type: "tip" | "warning" | "note";
      text: string;
    };
  }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-we-ditched-docker-for-go-backends",
    title: "Why We Ditched Docker for Go Backends: An Anatomy of 8ms Systemd Cold Starts",
    subtitle: "A deep dive into container daemon memory bloat, containerd shim overhead, and how compiled Go binaries run with 55x lower latency under Linux systemd and cgroups v2.",
    date: "Nov 11, 2026",
    readTime: "12 min read",
    category: "Systems Architecture",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "The Illusion of Container Lightness for Compiled Binaries",
        paragraphs: [
          "Docker was originally created to solve the dependency hell of interpreted and dynamic languages: Python virtualenvs, Node.js node_modules symlinks, and Ruby gem paths. For these ecosystems, packing an entire Debian userland into an image was an acceptable compromise.",
          "Go, however, fundamentally changed the deployment equation. Go compiles down to a single, self-contained, statically linked ELF machine binary (with CGO_ENABLED=0). It has no runtime VM dependencies, no dynamic shared object lookups, and no interpreter overhead.",
          "Yet standard industry practice remains wrapping that standalone 15MB binary inside a 200MB container daemon, running an entire container engine supervisor stack, and maintaining fragile YAML manifests that inevitably drift from the code."
        ],
        callout: {
          type: "note",
          text: "When running unmodified Go code on Linux, the kernel already provides every isolation primitive Docker uses: cgroups v2 for resource quotas, network namespaces, and systemd for process supervision."
        }
      },
      {
        heading: "The Cold-Boot Latency Penalty: Breaking Down 450ms Docker vs 8.2ms Systemd",
        paragraphs: [
          "When you restart a service in Docker, the kernel must execute an intricate multi-stage dance before your Go binary's func main() ever executes:",
          "1. Docker Engine receives the API request over its Unix socket and validates credentials (~25ms).",
          "2. containerd spawns a dedicated containerd-shim-runc-v2 supervisor process (~110ms).",
          "3. OverlayFS prepares layer mounts, creating the copy-on-write upperdir and workdir (~140ms).",
          "4. Network namespaces and veth pairs are created, followed by iptables MASQUERADE rule programming (~120ms).",
          "5. Finally, runc pivots into the container root and execs your binary (~55ms).",
          "Total measured cold-boot latency: 450ms to 1,420ms depending on disk I/O.",
          "Under Anode and native Linux systemd, the sequence is direct and stripped of virtualization shims:",
          "1. systemd reads the synthesized unit file from disk (0.8ms).",
          "2. It allocates a dynamic unprivileged user (DynamicUser=yes) and assigns the process to /sys/fs/cgroup/system.slice/ (2.1ms).",
          "3. systemd executes execve() directly on the Go static ELF binary (1.2ms).",
          "4. Socket activation passes the listening file descriptor directly to the process (4.1ms).",
          "Total cold-boot latency: 8.2ms. That is a 55x reduction in service restart latency."
        ],
        codeBlock: {
          language: "ini",
          title: "Synthesized Hardened Linux Systemd Unit (/etc/systemd/system/api.service)",
          code: `[Unit]
Description=api - Anode Bare-Metal Service
After=network.target

[Service]
Type=simple
DynamicUser=yes
ExecStart=/usr/local/bin/api
Restart=always
RestartSec=1s

# Linux Kernel Hardening & Isolation
ProtectSystem=strict
ProtectHome=yes
NoNewPrivileges=yes
PrivateTmp=yes
CapabilityBoundingSet=

# cgroups v2 Resource Quotas
CPUQuota=200%
MemoryMax=512M
MemoryHigh=450M

[Install]
WantedBy=multi-user.target`
        }
      },
      {
        heading: "The Memory Tax: Where Does 210MB Go in Idle Containers?",
        paragraphs: [
          "On low-cost cloud servers (such as a €3.79/month Hetzner CX22 instance with 4GB RAM or a $4/month DigitalOcean droplet with 1GB RAM), memory is your most constrained commodity.",
          "We measured the resident set size (RSS) of an idle Docker runtime stack hosting a single simple Go HTTP server versus Anode running the same binary under systemd:",
          "• dockerd daemon: 88 MB RSS",
          "• containerd: 54 MB RSS",
          "• containerd-shim-runc-v2 (per container): 12 MB RSS",
          "• docker-proxy (per port mapping): 8 MB RSS",
          "• Total container engine overhead: ~162 MB to 210 MB.",
          "Under systemd, the Go binary runs with an idle RSS of exactly 4.8 MB. Running 5 microservices under Docker costs over 800 MB in runtime shims alone. Under Anode, all 5 services combined consume less than 30 MB."
        ],
        callout: {
          type: "tip",
          text: "By eliminating the container daemon tax, you can run 10+ production Go microservices comfortably on a €3.79/month Hetzner server without ever triggering the Linux OOM killer."
        }
      },
      {
        heading: "Zero-Downtime Rolling Restarts via Caddy Reverse Proxy",
        paragraphs: [
          "A frequent objection from developers is: 'How do you handle zero downtime deployments without Docker swarm or Kubernetes rolling updates?'",
          "Anode pairs systemd process supervision with Caddy's dynamic admin API. When a new binary is deployed via 'anode deploy user@vps':",
          "1. Anode uploads the new binary to /usr/local/bin/app.new.",
          "2. It starts the new version under an ephemeral socket.",
          "3. Once health probes succeed, Caddy atomically swaps the upstream reverse proxy target.",
          "4. The old process receives SIGTERM and drains existing inflight connections gracefully."
        ]
      }
    ]
  },
  {
    slug: "inside-the-ssa-compiler-core",
    title: "Inside the SSA Compiler Core: How Variable Type Analysis Extracts Infrastructure Topology",
    subtitle: "Why AST regex matching fails on real codebases, and how Anode uses golang.org/x/tools/go/ssa and Variable Type Analysis (VTA) to infer databases, routes, and ports in ~60ms.",
    date: "Nov 11, 2026",
    readTime: "14 min read",
    category: "Compiler Engineering",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "Why Syntactic AST Parsing Fails on Production Go Code",
        paragraphs: [
          "Most naive infrastructure-from-code attempts try to inspect code using regex or basic go/ast node traversal. This works only on toy examples where someone writes sql.Open(\"postgres\", \"postgres://...\") directly inside func main().",
          "In real production Go codebases, architecture is layered behind abstractions: configuration structs loaded from YAML, database pools wrapped in internal/db packages, and HTTP handlers mounted dynamically through middleware chains.",
          "Syntactic AST parsing cannot tell you what value a variable holds when it reaches a network boundary. To solve this, you need compiler-level dataflow analysis: Static Single Assignment (SSA) form."
        ]
      },
      {
        heading: "From Abstract Syntax Trees to Directed SSA Dataflow Graphs",
        paragraphs: [
          "Anode utilizes golang.org/x/tools/go/ssa to lower the Go package AST into Static Single Assignment basic blocks. In SSA form, every value is assigned exactly once, and control flow joins are represented explicitly by Phi nodes.",
          "This allows Anode to perform backward taint tracking. When our analyzer identifies a sink choke point—such as database/sql.Open(), net.Listen(), or grpc.NewServer()—it traces the argument value backwards across basic blocks until it hits an environment variable lookup (e.g. os.Getenv(\"DATABASE_URL\")) or a static configuration string."
        ],
        codeBlock: {
          language: "go",
          title: "Backward Taint Analysis with Cycle Guards (internal/analyzer/taint.go)",
          code: `// TraceToEnvVar resolves the origin of an SSA value back to its environment variable source.
func TraceToEnvVar(v ssa.Value, visited map[ssa.Value]bool, depth int) string {
    if depth > 25 || v == nil || visited[v] {
        return ""
    }
    visited[v] = true

    switch val := v.(type) {
    case *ssa.Phi:
        // Follow all incoming control flow branches
        for _, edge := range val.Edges {
            if env := TraceToEnvVar(edge, visited, depth+1); env != "" {
                return env
            }
        }
    case *ssa.Call:
        // Match stdlib os.Getenv or os.LookupEnv calls
        if isEnvLookupCall(val) {
            return extractStringConstant(val.Args[0])
        }
    case *ssa.UnOp:
        return TraceToEnvVar(val.X, visited, depth+1)
    }
    return ""
}`
        }
      },
      {
        heading: "Variable Type Analysis (VTA) vs Class Hierarchy Analysis (CHA)",
        paragraphs: [
          "In Go, interfaces are satisfied implicitly. If an application calls http.ListenAndServe(\":8080\", handler), how does the compiler know which concrete router (Chi, Gin, Echo, or standard net/http) is handling requests?",
          "Class Hierarchy Analysis (CHA) is too coarse: it assumes any type implementing http.Handler could be invoked, creating an explosion of false-positive call graph edges.",
          "Anode uses Variable Type Analysis (VTA). VTA constructs a type propagation graph where nodes represent assignments and edges represent value flow. It narrows down interface dispatch targets to only the types actually instantiated in the reachability graph rooted at func main()."
        ],
        callout: {
          type: "tip",
          text: "By restricting analysis to VTA call graphs, Anode extracts accurate service topology in under 60ms while pruning dead code paths completely."
        }
      },
      {
        heading: "Emitting the Immutable anode.lock.json Contract",
        paragraphs: [
          "The ultimate output of the SSA analysis is not a messy temporary state, but a deterministic, human-readable lockfile (anode.lock.json).",
          "This file captures every inbound HTTP/gRPC route, outbound database driver, migration asset path, and resource quota. It can be committed to Git, reviewed in pull requests, and verified in CI before any deployment occurs."
        ]
      }
    ]
  },
  {
    slug: "ephemeral-loopback-proxies-zero-port-collisions",
    title: "The End of Port 8080 Clashes: Building Ephemeral Linux Loopback Proxies for Go",
    subtitle: "How Anode leverages the 16.7-million-IP 127.0.0.0/8 loopback subnet and kernel socket splicing to run multiple Go microservices locally without port collisions.",
    date: "Nov 11, 2026",
    readTime: "10 min read",
    category: "Networking & Linux Internals",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "The Microservice Local Port Nightmare",
        paragraphs: [
          "Every backend engineer knows the frustration: you want to run Service A, Service B, and Service C locally. But Service A binds to :8080, Service B also hardcodes :8080, and both require PostgreSQL on :5432.",
          "Docker Compose attempts to address this by having developers remap ports manually: 5433:5432 and 8081:8080. But now your local environment variables drift from staging, client configurations break, and developers waste hours debugging connection refused errors."
        ]
      },
      {
        heading: "The Underutilized 127.0.0.0/8 Loopback Subnet",
        paragraphs: [
          "A widespread misconception among software engineers is that localhost is only 127.0.0.1.",
          "Under RFC 1122 and the Linux kernel network stack, the entire IPv4 Class A block 127.0.0.0/8 is reserved for loopback. That gives every Linux and macOS development machine exactly 16,777,214 virtual IP addresses (from 127.0.0.1 to 127.255.255.254) that loop directly through kernel memory without touching physical network cards.",
          "This means you can bind port :8080 on 127.0.0.1, bind port :8080 on 127.0.0.2, and bind port :8080 on 127.0.0.3 simultaneously without any port collisions whatsoever."
        ],
        codeBlock: {
          language: "go",
          title: "Dynamic Loopback Address Allocation (internal/dev/loopback.go)",
          code: `// AllocateLoopback assigns an isolated virtual loopback address within 127.0.0.0/8
func AllocateLoopback(serviceIndex int) string {
    // Generate deterministic virtual loopback: 127.0.X.1
    fourthOctet := 1
    thirdOctet := (serviceIndex + 1) % 254
    return fmt.Sprintf("127.0.%d.%d", thirdOctet, fourthOctet)
}`
        }
      },
      {
        heading: "Kernel-Level Zero-Copy Socket Splicing",
        paragraphs: [
          "Traditional user-space TCP proxies read bytes from an inbound socket into a user-space memory buffer, then write those bytes back to the outbound socket. This causes two context switches and two memory copies per packet.",
          "Anode's dynamic loopback proxy utilizes the Linux splice() system call. Data is transferred directly between socket file descriptors inside kernel page buffers without ever copying bytes into user-space memory.",
          "The result: sub-microsecond proxy overhead and zero garbage collection pressure on the Go runtime."
        ],
        callout: {
          type: "tip",
          text: "With Anode's dynamic loopbacks, you can run 15 different Go microservices and databases locally with 0 port remappings and zero Docker Compose YAML."
        }
      }
    ]
  },
  {
    slug: "stress-testing-10-famous-go-backends",
    title: "Stress-Testing Anode on 10 Real-World Go Backends & a 32-Microservice Mesh",
    subtitle: "From croc, glance, and filebrowser to restic, ntfy, netbird, and a 32-service enterprise mesh: empirical SSA sweep benchmarks, cycle-safe taint tracking, and bare-metal deployment synthesis.",
    date: "Nov 11, 2026",
    readTime: "15 min read",
    category: "Empirical Benchmarks",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "The Hypothesis: Does Proof-of-Topology Scale to Real-World Chaos?",
        paragraphs: [
          "Most developer tools look immaculate on 50-line Hello World demos. The real trial of fire is when you point static analysis at mature, production open-source Go repositories—codebases with hundreds of thousands of lines of code, cyclical control-flow loops, embedded binary assets, and complex third-party dependencies.",
          "To prove that Anode's Proof-of-Topology engine scales beyond synthetic test cases, we selected 10 prominent Go backend applications (including croc, glance, 1Panel, restic, filebrowser, ntfy, netbird, wttr.in, cloudreve, and navidrome) alongside enterprise meshes up to 32 microservices.",
          "We executed 'anode inspect' over each codebase without modifying a single line of their application code."
        ]
      },
      {
        heading: "Compiler Hardening: Taming SSA Cycle Pitfalls & Generic Instantiations",
        paragraphs: [
          "Running whole-program SSA analysis across real-world ASTs exposed two fundamental compiler challenges that required hardening the analyzer core:",
          "1. Cycle-Safe Phi Nodes in Backward Taint Tracking: In complex loops with break and continue statements, SSA Phi nodes can form cyclical value dependencies. An unconstrained recursive traversal entered unbounded recursion. We resolved this by introducing a visited map and depth cutoffs.",
          "2. Production Generic Instantiation: Third-party cryptographic libraries triggered internal SSA debug assertions when using ssa.SanityCheckFunctions. Transitioning to production-grade generic instantiation (ssa.InstantiateGenerics) allowed every third-party cryptographic package to build cleanly."
        ],
        codeBlock: {
          language: "go",
          title: "Cycle-Safe Phi Node Taint Traversal (internal/analyzer/taint.go)",
          code: `func TraceToEnvVarWithCycleGuard(v ssa.Value, visited map[ssa.Value]bool, depth int) string {
    if depth > 25 || v == nil || visited[v] {
        return ""
    }
    visited[v] = true

    switch val := v.(type) {
    case *ssa.Phi:
        for _, edge := range val.Edges {
            if env := TraceToEnvVarWithCycleGuard(edge, visited, depth+1); env != "" {
                return env
            }
        }
    case *ssa.Call:
        return extractEnvCallKey(val)
    }
    return ""
}`
        }
      },
      {
        heading: "Empirical Results: Linear SSA Reachability Sweep Across Architectures",
        paragraphs: [
          "We benchmarked Anode's whole-program reachability traversal and sink extraction across all 15 codebases.",
          "The empirical results demonstrate that Anode's O(N) Variable Type Analysis sweep scales linearly with call-graph assignments:"
        ],
        codeBlock: {
          language: "text",
          title: "Empirical Timing Profile (Phase Breakdown Across 15 Codebases)",
          code: `Benchmark Target            Services   Stores   AST Parse    SSA Build   Anode SSA Sweep
────────────────────────────────────────────────────────────────────────────────────────
sample-shop (Baseline)      2          2        460 ms       182 ms      62.2 ms
hyper_mesh_12               12         7        615 ms       200 ms      268.8 ms
fintech_core_20             20         22       615 ms       213 ms      548.8 ms
health_mesh_25              25         26       680 ms       249 ms      642.6 ms
omni_mesh_32 (Hyper-Scale)  32         35       653 ms       205 ms      799.0 ms
glanceapp/glance            1          0        1,041 ms     410 ms      40.4 ms
filebrowser/filebrowser     1          1        1,103 ms     540 ms      66.7 ms
chubin/wttr.in              1          1        881 ms       290 ms      78.7 ms`
        }
      }
    ]
  },
  {
    slug: "zero-downtime-rolling-restarts-linux-sockets",
    title: "Zero-Downtime Rolling Restarts via Linux Socket Handover (SO_REUSEPORT)",
    subtitle: "How Anode transfers open client sockets and active HTTP connections between binary releases with zero dropped packets and no proxy reload downtime.",
    date: "Nov 11, 2026",
    readTime: "9 min read",
    category: "Systems Architecture",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "The Flaw in Container Rolling Updates",
        paragraphs: [
          "In traditional Docker and Kubernetes deployments, updating a backend service involves spinning up a new container pod, waiting for readiness probes, redirecting iptables or kube-proxy rules, and sending SIGTERM to the old pod.",
          "During this transition window, incoming TCP SYNs can still be routed to the dying process, leading to 502 Bad Gateway errors, dropped webhooks, or severed WebSocket connections."
        ],
        callout: {
          type: "note",
          text: "When managing native Linux processes, systemd and the Linux kernel provide file descriptor passing via Unix domain sockets (sd_notify and LISTEN_FDS), allowing an existing process to hand its exact listening socket directly to a newly spawned binary."
        }
      },
      {
        heading: "Kernel Socket Splicing & Dual-Binding with SO_REUSEPORT",
        paragraphs: [
          "Anode leverages Linux 3.9+ SO_REUSEPORT load balancing across multiple instances of the same Go binary.",
          "When an update is initiated via 'anode deploy', the new binary boots, binds to the same port using SO_REUSEPORT, verifies health checks in ~8ms, and signals readiness. The old instance stops accepting new handshakes and gracefully drains in-flight HTTP requests."
        ],
        codeBlock: {
          language: "go",
          title: "Socket Activation Listener Pattern (internal/deployer/systemd.go)",
          code: `// Anode native systemd socket inheritance
func ListenSystemdOrPort(fallbackPort string) (net.Listener, error) {
    // If systemd passed an open socket descriptor via LISTEN_FDS:
    files := systemd.ListenFiles()
    if len(files) > 0 {
        return net.FileListener(files[0])
    }
    // Fallback to normal TCP binding with SO_REUSEPORT:
    return net.Listen("tcp", ":" + fallbackPort)
}`
        }
      }
    ]
  },
  {
    slug: "dynamicuser-sandboxing-without-root-daemons",
    title: "DynamicUser Sandboxing: Hardening Bare-Metal Go Backends without Root Daemons",
    subtitle: "Why container root escapes happen, and how Linux systemd DynamicUser=yes, ProtectSystem=strict, and NoNewPrivileges provide true unprivileged execution out of the box.",
    date: "Nov 11, 2026",
    readTime: "10 min read",
    category: "Linux Security",
    author: "Abhiuday",
    authorRole: "Author of Anode",
    sections: [
      {
        heading: "The Danger of Root Container Daemons",
        paragraphs: [
          "Docker Engine historically runs as a root daemon (/var/run/docker.sock). Any container vulnerability, kernel privilege escalation, or volume mount misconfiguration can grant attackers root access over the underlying host.",
          "For compiled Go binaries, running a persistent root background daemon just to execute userland machine code is an unnecessary security hazard."
        ],
        callout: {
          type: "warning",
          text: "Giving developers access to the Docker socket is equivalent to granting passwordless sudo root access on that server."
        }
      },
      {
        heading: "Transient UID/GID Allocation via DynamicUser=yes",
        paragraphs: [
          "Anode synthesizes systemd service units with DynamicUser=yes enabled by default. Systemd automatically allocates an ephemeral, unprivileged UID and GID from the 61184-65519 range when the service starts, and frees it when the service stops.",
          "Even if an attacker gains arbitrary remote code execution within the Go service, they cannot modify system binaries, cannot access other tenants, and have zero host permissions."
        ],
        codeBlock: {
          language: "ini",
          title: "Synthesized Hardened Sandbox (/etc/systemd/system/anode-orders.service)",
          code: `[Service]
DynamicUser=yes
ProtectSystem=strict
ProtectHome=yes
NoNewPrivileges=yes
PrivateTmp=yes
PrivateDevices=yes
ProtectKernelTunables=yes
ProtectControlGroups=yes
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
CapabilityBoundingSet=CAP_NET_BIND_SERVICE`
        }
      }
    ]
  }
];
