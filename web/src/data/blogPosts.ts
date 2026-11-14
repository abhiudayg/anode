export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  metaTitle?: string;
  metaDescription?: string;
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
    slug: "inside-the-ssa-compiler-core",
    title: "Inside the SSA Compiler Core: How Variable Type Analysis Extracts Infrastructure Topology",
    subtitle: "Why AST regex matching fails on real codebases, and how Anode uses golang.org/x/tools/go/ssa and Variable Type Analysis (VTA) to infer databases, routes, and ports.",
    metaTitle: "Inside the SSA Compiler Core",
    metaDescription: "Why AST regex matching fails on real codebases and how Anode uses Go SSA and Variable Type Analysis (VTA) to infer infrastructure topology.",
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
          text: "By restricting analysis to VTA call graphs, Anode extracts the service topology and prunes code the program can never reach."
        }
      },
      {
        heading: "Emitting the Immutable anode.lock.json Contract",
        paragraphs: [
          "The ultimate output of the SSA analysis is not a messy temporary state, but a deterministic, human-readable lockfile (anode.lock.json).",
          "This file captures every inbound HTTP/gRPC route, outbound database driver, migration asset path, and resource quota. It can be committed to Git and reviewed in pull requests."
        ]
      }
    ]
  },
  {
    slug: "dynamicuser-sandboxing-without-root-daemons",
    title: "DynamicUser Sandboxing: Hardening Bare-Metal Go Backends without Root Daemons",
    subtitle: "Why container root escapes happen, and how Linux systemd DynamicUser=yes, ProtectSystem=strict, and NoNewPrivileges provide true unprivileged execution out of the box.",
    metaTitle: "DynamicUser Sandboxing for Go Backends",
    metaDescription: "Why container root escapes happen and how Linux systemd DynamicUser=yes, ProtectSystem=strict, and NoNewPrivileges provide true unprivileged execution.",
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
          "Even if an attacker gains code execution inside the Go service, the unit runs as a temporary unprivileged user, the system filesystem is read-only to it, and it can write only to its own state directory."
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
