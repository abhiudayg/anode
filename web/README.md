# Anode Web Application & Documentation Hub

The official website, interactive documentation, and engineering journal for **Anode** — the bare-metal Go backend orchestrator that replaces Dockerfiles and Kubernetes with the 4-Pillar Proof of Topology.

Built with a high-end, tactile developer aesthetic inspired by Resend, Vercel, and Linear.

---

## 🎨 Visual System & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | **Next.js 15 (App Router)** | React Server Components, client hydration, and edge-ready static prerendering |
| **Language** | **TypeScript** | Strict compile-time typing for UI state and documentation trees |
| **Styling** | **Tailwind CSS v4** | Rapid tokenized CSS layout with obsidian dark mode (`#08090b`) |
| **Animations** | **Motion (`motion/react`)** | Spring physics, tab transitions, interactive pipeline step visualizers |
| **Smooth Scrolling** | **Lenis** | Butter-smooth momentum wheel scrolling with auto-resize observers |
| **Icons** | **Lucide React + Devicon SVG** | Pixel-crisp iconography and custom standard SVGs |
| **Package Manager** | **Bun** | Sub-second package installs and local script execution |

---

## 📁 Project Architecture

```
web/
├── public/                 # Static assets, favicons, branding
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root HTML layout with SmoothScroll and metadata
│   │   ├── globals.css     # Dark mode tokens, grid & dot meshes, glassmorphism
│   │   ├── page.tsx        # Hero landing page & interactive terminal showcase
│   │   ├── docs/
│   │   │   └── page.tsx    # Interactive searchable documentation & CLI guides
│   │   └── blog/
│   │       └── page.tsx    # Technical engineering journal & architectural essays
│   ├── components/
│   │   ├── Navbar.tsx      # Floating glassmorphic header with mobile drawer
│   │   ├── Hero.tsx        # Ambient radial glow, copyable install, hero badge
│   │   ├── InteractiveTerminal.tsx # Simulated CLI (inspect, dev, lockfile tabs)
│   │   ├── TopologyPipeline.tsx    # Interactive 4-Pillar pipeline node visualizer
│   │   ├── DriftComparison.tsx     # Split-diff Docker Compose vs Anode engine
│   │   ├── BentoPillars.tsx        # 4 Bento cards with cursor spotlight beam
│   │   ├── BenchmarkSection.tsx    # 8ms cold starts vs 1420ms container metrics
│   │   ├── QuickstartSection.tsx   # 60-second copyable command walkthrough
│   │   ├── SmoothScroll.tsx        # Responsive Lenis wrapper with height tracking
│   │   ├── Icons.tsx               # Standard SVG components (GitHub, Go)
│   │   └── Footer.tsx              # Minimalist technical footer with verification
│   └── lib/
│       └── utils.ts        # Tailwind merge & clsx utilities
├── package.json            # Scripts and dependencies
└── tsconfig.json           # Path aliases (@/* -> src/*)
```

---

## 🚀 Local Development

Ensure [Bun](https://bun.sh) is installed on your workstation:

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build production bundle
bun run build

# Preview production build locally
bun start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 Key Sections

### 1. Landing Page (`/`)
* **Live Interactive Terminal**: Switch between `anode inspect`, `anode dev`, and `anode.lock.json` with animated syntax highlighting.
* **Proof of Topology Flow**: Visual pipeline showing Go AST parsing, VTA call-graph dead-code pruning, and Linux systemd synthesis.
* **Architecture Drift Comparison**: Side-by-side split comparison demonstrating why YAML-based Docker declarations drift from code.
* **The 4 Pillars Bento Grid**: Cards with cursor-following radial spotlight lighting.

### 2. Interactive Documentation (`/docs`)
* Full, self-contained documentation with instant search filtering.
* Complete CLI command reference, compiler theory breakdowns, dynamic ephemeral port mechanics, and bare-metal systemd unit templates.
* Architectural comparison table contrasting Anode against Kubernetes, Docker Compose, Encore, and Terraform.

### 3. Engineering Journal (`/blog`)
* Long-form, publication-grade architectural essays:
  - *Why We Killed Dockerfiles: The 4-Pillar Proof of Topology*
  - *Solving Infrastructure-from-Code with SSA & Variable Type Analysis in Go*
  - *Bare-Metal systemd vs Docker: Benchmarking Cold Starts & Memory Overhead*
  - *Multi-Node Bin-Packing and Compiler-Generated Zero-Trust Firewalls (`nftables`)*

---

## 🚢 Deployment

The website prerenders 100% statically and can be deployed with zero configuration on:

* **Vercel**: Push to GitHub and import repository; build command is `bun run build`.
* **Cloudflare Pages / Netlify / VPS**: Run `bun run build` and serve the generated output.
