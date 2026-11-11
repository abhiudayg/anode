import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(__dirname, 'ph_assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Common styles & defs for consistent branding across all slides
const COMMON_DEFS = `
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d14"/>
      <stop offset="40%" stop-color="#080a0f"/>
      <stop offset="100%" stop-color="#040608"/>
    </linearGradient>

    <!-- Accent Gradients -->
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#00add8"/>
    </linearGradient>

    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>

    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#070c14" stop-opacity="0.95"/>
    </linearGradient>

    <linearGradient id="cardGradLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.6"/>
    </linearGradient>

    <!-- Background Pattern -->
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#1e293b" stroke-width="0.8" stroke-opacity="0.35"/>
      <circle cx="48" cy="48" r="1.5" fill="#38bdf8" fill-opacity="0.25"/>
    </pattern>

    <!-- Glow Filters -->
    <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="90" result="blur"/>
    </filter>
    <filter id="glowPurple" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="100" result="blur"/>
    </filter>
    <filter id="glowBlue" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="110" result="blur"/>
    </filter>
  </defs>
`;

// Slide 1: Hero Overview
const slide1Svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1270 760" width="1270" height="760">
  ${COMMON_DEFS}

  <!-- Background Layer -->
  <rect width="1270" height="760" fill="url(#bgGrad)"/>
  <rect width="1270" height="760" fill="url(#grid)"/>

  <!-- Ambient Light Orbs -->
  <circle cx="220" cy="180" r="280" fill="#00add8" fill-opacity="0.12" filter="url(#glowCyan)"/>
  <circle cx="1060" cy="520" r="320" fill="#6366f1" fill-opacity="0.10" filter="url(#glowPurple)"/>

  <!-- Left Hero Column -->
  <g transform="translate(80, 80)">
    <!-- Brand / Version Pill -->
    <g>
      <rect width="330" height="38" rx="19" fill="#00add8" fill-opacity="0.12" stroke="#00add8" stroke-opacity="0.4" stroke-width="1.2"/>
      <!-- Hexagon / Topology Icon -->
      <g transform="translate(14, 9) scale(0.85)" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <polygon points="12 2 2 8.5 2 15.5 12 22 22 15.5 22 8.5 12 2" fill="#00add8" fill-opacity="0.25"/>
        <line x1="12" y1="22" x2="12" y2="15.5"/>
        <polyline points="22 8.5 12 15.5 2 8.5"/>
      </g>
      <text x="44" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" letter-spacing="1.2">
        ANODE v1.0 • PROOF-OF-TOPOLOGY
      </text>
    </g>

    <!-- Main Headline -->
    <text x="0" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="54" font-weight="800" fill="#ffffff" letter-spacing="-1.8">
      Deploy Unmodified Go
    </text>
    <text x="0" y="174" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="54" font-weight="800" fill="url(#cyanGrad)" letter-spacing="-1.8">
      Directly to Bare Metal.
    </text>

    <!-- Tagline & Description -->
    <text x="0" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="21" font-weight="600" fill="#e2e8f0">
      Zero Docker. Zero Kubernetes. Zero YAML Drift.
    </text>
    <text x="0" y="272" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="15.5" font-weight="400" fill="#94a3b8">
      Anode inspects whole-program Go SSA call graphs to auto-discover
    </text>
    <text x="0" y="296" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="15.5" font-weight="400" fill="#94a3b8">
      routes &amp; database drivers in ~60ms, synthesising hardened Linux services.
    </text>

    <!-- 3 Key Metric Badges -->
    <g transform="translate(0, 350)">
      <!-- Metric 1: 8ms Cold Boot -->
      <g>
        <rect width="155" height="74" rx="12" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.2"/>
        <text x="18" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="24" font-weight="800" fill="#22d3ee">
          8 ms
        </text>
        <text x="18" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="600" fill="#64748b" letter-spacing="0.5">
          COLD BOOT TIME
        </text>
      </g>

      <!-- Metric 2: 4.8MB RAM -->
      <g transform="translate(175, 0)">
        <rect width="155" height="74" rx="12" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.2"/>
        <text x="18" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="24" font-weight="800" fill="#38bdf8">
          4.8 MB
        </text>
        <text x="18" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="600" fill="#64748b" letter-spacing="0.5">
          RAM FOOTPRINT
        </text>
      </g>

      <!-- Metric 3: 100% SSA -->
      <g transform="translate(350, 0)">
        <rect width="165" height="74" rx="12" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.2"/>
        <text x="18" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="24" font-weight="800" fill="#4ade80">
          100% SSA
        </text>
        <text x="18" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="600" fill="#64748b" letter-spacing="0.5">
          STATIC PROVENANCE
        </text>
      </g>
    </g>

    <!-- Bottom URL & License Footer -->
    <g transform="translate(0, 480)">
      <rect width="515" height="42" rx="8" fill="#0f172a" fill-opacity="0.6" stroke="#1e293b" stroke-width="1"/>
      <circle cx="20" cy="21" r="4" fill="#22c55e"/>
      <text x="32" y="26" font-family="'SF Mono', Menlo, Monaco, Consolas, monospace" font-size="13" font-weight="600" fill="#e2e8f0">
        anode.abhiudayg.dev
      </text>
      <text x="210" y="26" font-family="'SF Mono', Menlo, Monaco, Consolas, monospace" font-size="13" font-weight="400" fill="#475569">
        •
      </text>
      <text x="228" y="26" font-family="'SF Mono', Menlo, Monaco, Consolas, monospace" font-size="13" font-weight="500" fill="#38bdf8">
        github.com/abhiudayg/anode
      </text>
      <text x="445" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="11.5" font-weight="700" fill="#a855f7">
        APACHE 2.0
      </text>
    </g>
  </g>

  <!-- Right Hero Column: Interactive Terminal Cockpit -->
  <g transform="translate(670, 75)">
    <!-- Terminal Shadow Glow -->
    <rect x="-10" y="-10" width="530" height="580" rx="20" fill="#00add8" fill-opacity="0.04" filter="url(#glowCyan)"/>

    <!-- Terminal Outer Frame -->
    <rect width="510" height="560" rx="16" fill="url(#cardGrad)" stroke="#00add8" stroke-opacity="0.35" stroke-width="1.6"/>

    <!-- Terminal Header Bar -->
    <path d="M 0 16 C 0 7.163 7.163 0 16 0 L 494 0 C 502.837 0 510 7.163 510 16 L 510 46 L 0 46 Z" fill="#090d16"/>
    <line x1="0" y1="46" x2="510" y2="46" stroke="#1e293b" stroke-width="1"/>

    <!-- Window Dots -->
    <circle cx="24" cy="23" r="6" fill="#ef4444" opacity="0.9"/>
    <circle cx="42" cy="23" r="6" fill="#f59e0b" opacity="0.9"/>
    <circle cx="60" cy="23" r="6" fill="#10b981" opacity="0.9"/>

    <!-- Terminal Title -->
    <text x="86" y="28" font-family="'SF Mono', Menlo, Monaco, Consolas, monospace" font-size="12" font-weight="500" fill="#94a3b8">
      terminal — anode deploy production
    </text>

    <!-- Terminal Inner Content -->
    <g transform="translate(26, 76)" font-family="'SF Mono', Menlo, Monaco, Consolas, monospace" font-size="13.5">
      <text x="0" y="0" fill="#38bdf8" font-weight="700">$ anode deploy --target bare-metal-01</text>
      
      <text x="0" y="34" fill="#64748b">→ Inspecting Go SSA AST (orders, billing, notify)...</text>
      
      <text x="0" y="72" fill="#38bdf8" font-weight="700">✓</text>
      <text x="20" y="72" fill="#e2e8f0" font-weight="600">Discovered Ingress:</text>
      <text x="200" y="72" fill="#22d3ee">POST /v1/orders (:8080)</text>

      <text x="0" y="106" fill="#38bdf8" font-weight="700">✓</text>
      <text x="20" y="106" fill="#e2e8f0" font-weight="600">Inferred DB Drivers:</text>
      <text x="200" y="106" fill="#a78bfa">Postgres 16 (pgx/v5)</text>

      <text x="0" y="140" fill="#38bdf8" font-weight="700">✓</text>
      <text x="20" y="140" fill="#e2e8f0" font-weight="600">Dynamic Loopback:</text>
      <text x="200" y="140" fill="#34d399">127.0.0.1:5432 (0% conflict)</text>

      <text x="0" y="174" fill="#38bdf8" font-weight="700">✓</text>
      <text x="20" y="174" fill="#e2e8f0" font-weight="600">Synthesized Service:</text>
      <text x="200" y="174" fill="#f59e0b">systemd [anode-api.slice]</text>

      <line x1="0" y1="206" x2="458" y2="206" stroke="#1e293b" stroke-width="1.2"/>

      <!-- Live Runtime Banner -->
      <g transform="translate(0, 230)">
        <rect width="458" height="92" rx="10" fill="#00add8" fill-opacity="0.08" stroke="#00add8" stroke-opacity="0.4" stroke-width="1.2"/>
        <circle cx="20" cy="28" r="5" fill="#22c55e"/>
        <text x="34" y="32" font-size="13" fill="#38bdf8" font-weight="700">PRODUCTION RUNTIME CONFIRMED</text>
        <text x="20" y="58" font-size="12" fill="#e2e8f0">Cold Boot: <tspan fill="#22d3ee" font-weight="700">8.2ms</tspan> • RAM: <tspan fill="#38bdf8" font-weight="700">4.8MB</tspan> • PID: 8192</text>
        <text x="20" y="78" font-size="11.5" fill="#94a3b8">Ingress Route: https://api.shop.com (cgroups v2 active)</text>
      </g>

      <!-- Second Terminal Command -->
      <g transform="translate(0, 360)">
        <text x="0" y="0" fill="#38bdf8" font-weight="700">$ anode inspect --topology</text>
        <text x="0" y="28" fill="#4ade80">● 3 microservices linked via local loopback mesh</text>
        <text x="0" y="52" fill="#64748b">  └─ orders:8080 ➔ postgres:5432 (verified SSA)</text>
        <text x="0" y="76" fill="#64748b">  └─ zero docker daemon overhead detected</text>
      </g>

      <!-- Active Cursor -->
      <g transform="translate(0, 470)">
        <text x="0" y="0" fill="#4ade80" font-weight="700">$</text>
        <text x="16" y="0" fill="#cbd5e1">_</text>
      </g>
    </g>
  </g>
</svg>
`;

// Slide 2: Architecture & Proof-of-Topology Pipeline
const slide2Svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1270 760" width="1270" height="760">
  ${COMMON_DEFS}

  <rect width="1270" height="760" fill="url(#bgGrad)"/>
  <rect width="1270" height="760" fill="url(#grid)"/>

  <circle cx="300" cy="180" r="260" fill="#00add8" fill-opacity="0.10" filter="url(#glowCyan)"/>
  <circle cx="950" cy="480" r="280" fill="#a855f7" fill-opacity="0.10" filter="url(#glowPurple)"/>

  <!-- Header -->
  <g transform="translate(80, 60)">
    <rect width="260" height="32" rx="16" fill="#00add8" fill-opacity="0.12" stroke="#00add8" stroke-opacity="0.4" stroke-width="1"/>
    <text x="32" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" letter-spacing="1">
      COMPILER AS ORCHESTRATOR
    </text>

    <text x="0" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="-1.2">
      How Proof-of-Topology Works
    </text>
    <text x="0" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="17" font-weight="400" fill="#94a3b8">
      Source Go code compiled directly to hardened Linux runtime in 4 deterministic stages — in ~120ms.
    </text>
  </g>

  <!-- 4 Step Pipeline Grid -->
  <g transform="translate(80, 200)">
    <!-- Step 1: Go Source Code -->
    <g transform="translate(0, 0)">
      <rect width="255" height="380" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.4"/>
      <!-- Header Pill -->
      <rect x="18" y="18" width="80" height="26" rx="6" fill="#00add8" fill-opacity="0.15"/>
      <text x="32" y="35" font-family="'SF Mono', monospace" font-size="12" font-weight="700" fill="#38bdf8">STEP 01</text>
      
      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
        Go Source Code
      </text>
      <text x="18" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
        100% Unmodified
      </text>

      <!-- Mini Visual Box -->
      <g transform="translate(18, 126)">
        <rect width="219" height="150" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
        <text x="14" y="26" font-family="'SF Mono', monospace" font-size="11" fill="#a78bfa">package main</text>
        <text x="14" y="48" font-family="'SF Mono', monospace" font-size="11" fill="#64748b">import "net/http"</text>
        <text x="14" y="70" font-family="'SF Mono', monospace" font-size="11" fill="#64748b">import "pgx/v5"</text>
        <text x="14" y="100" font-family="'SF Mono', monospace" font-size="11" fill="#38bdf8">func handleOrders()</text>
        <text x="14" y="124" font-family="'SF Mono', monospace" font-size="11" fill="#34d399">http.Listen(":8080")</text>
      </g>

      <text x="18" y="304" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • No Dockerfile needed
      </text>
      <text x="18" y="328" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • No Kubernetes YAML
      </text>
      <text x="18" y="352" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Standard go build flow
      </text>
    </g>

    <!-- Arrow 1-2 -->
    <g transform="translate(262, 180)">
      <circle cx="12" cy="0" r="14" fill="#0f172a" stroke="#00add8" stroke-width="1.2"/>
      <path d="M 8 -4 L 16 0 L 8 4" stroke="#38bdf8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>

    <!-- Step 2: SSA Call Graph -->
    <g transform="translate(285, 0)">
      <rect width="255" height="380" rx="14" fill="url(#cardGrad)" stroke="#00add8" stroke-opacity="0.4" stroke-width="1.4"/>
      <rect x="18" y="18" width="80" height="26" rx="6" fill="#38bdf8" fill-opacity="0.2"/>
      <text x="32" y="35" font-family="'SF Mono', monospace" font-size="12" font-weight="700" fill="#38bdf8">STEP 02</text>
      
      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
        SSA Call Graph
      </text>
      <text x="18" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#38bdf8">
        Static Analysis (~60ms)
      </text>

      <!-- Mini Visual Box -->
      <g transform="translate(18, 126)">
        <rect width="219" height="150" rx="8" fill="#090d16" stroke="#00add8" stroke-opacity="0.3" stroke-width="1"/>
        <circle cx="40" cy="40" r="16" fill="#00add8" fill-opacity="0.2" stroke="#38bdf8"/>
        <text x="35" y="44" font-family="'SF Mono', monospace" font-size="10" fill="#ffffff">fn</text>
        <line x1="56" y1="40" x2="110" y2="75" stroke="#38bdf8" stroke-width="1.5"/>
        <line x1="56" y1="40" x2="110" y2="115" stroke="#a78bfa" stroke-width="1.5"/>
        <circle cx="126" cy="75" r="16" fill="#38bdf8" fill-opacity="0.2" stroke="#22d3ee"/>
        <text x="115" y="79" font-family="'SF Mono', monospace" font-size="9" fill="#22d3ee">HTTP</text>
        <circle cx="126" cy="115" r="16" fill="#a855f7" fill-opacity="0.2" stroke="#a78bfa"/>
        <text x="118" y="119" font-family="'SF Mono', monospace" font-size="9" fill="#a78bfa">DB</text>
      </g>

      <text x="18" y="304" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Discovers HTTP handlers
      </text>
      <text x="18" y="328" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Identifies DB drivers
      </text>
      <text x="18" y="352" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Zero runtime overhead
      </text>
    </g>

    <!-- Arrow 2-3 -->
    <g transform="translate(547, 180)">
      <circle cx="12" cy="0" r="14" fill="#0f172a" stroke="#00add8" stroke-width="1.2"/>
      <path d="M 8 -4 L 16 0 L 8 4" stroke="#38bdf8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>

    <!-- Step 3: Loopback Multiplexing -->
    <g transform="translate(570, 0)">
      <rect width="255" height="380" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.4"/>
      <rect x="18" y="18" width="80" height="26" rx="6" fill="#34d399" fill-opacity="0.15"/>
      <text x="32" y="35" font-family="'SF Mono', monospace" font-size="12" font-weight="700" fill="#34d399">STEP 03</text>
      
      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
        Dynamic Loopback
      </text>
      <text x="18" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#34d399">
        Zero Port Collisions
      </text>

      <!-- Mini Visual Box -->
      <g transform="translate(18, 126)">
        <rect width="219" height="150" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
        <text x="14" y="30" font-family="'SF Mono', monospace" font-size="10" fill="#64748b">127.0.0.1:0 (ephemeral)</text>
        <line x1="14" y1="46" x2="200" y2="46" stroke="#1e293b"/>
        <text x="14" y="68" font-family="'SF Mono', monospace" font-size="11" fill="#34d399">➜ Ingress Proxy</text>
        <text x="14" y="90" font-family="'SF Mono', monospace" font-size="10.5" fill="#cbd5e1">   :8080 multiplexed</text>
        <text x="14" y="114" font-family="'SF Mono', monospace" font-size="11" fill="#a78bfa">➜ DB Loopback</text>
        <text x="14" y="136" font-family="'SF Mono', monospace" font-size="10.5" fill="#cbd5e1">   :5432 auto-routed</text>
      </g>

      <text x="18" y="304" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Run multiple copies safely
      </text>
      <text x="18" y="328" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • No port 5432 or 8080 clash
      </text>
      <text x="18" y="352" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Instant local dev mesh
      </text>
    </g>

    <!-- Arrow 3-4 -->
    <g transform="translate(832, 180)">
      <circle cx="12" cy="0" r="14" fill="#0f172a" stroke="#00add8" stroke-width="1.2"/>
      <path d="M 8 -4 L 16 0 L 8 4" stroke="#38bdf8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>

    <!-- Step 4: Linux Bare-Metal Runtime -->
    <g transform="translate(855, 0)">
      <rect width="255" height="380" rx="14" fill="url(#cardGrad)" stroke="#4ade80" stroke-opacity="0.4" stroke-width="1.4"/>
      <rect x="18" y="18" width="80" height="26" rx="6" fill="#4ade80" fill-opacity="0.15"/>
      <text x="32" y="35" font-family="'SF Mono', monospace" font-size="12" font-weight="700" fill="#4ade80">STEP 04</text>
      
      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="700" fill="#ffffff">
        Bare-Metal systemd
      </text>
      <text x="18" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#4ade80">
        Native cgroups v2
      </text>

      <!-- Mini Visual Box -->
      <g transform="translate(18, 126)">
        <rect width="219" height="150" rx="8" fill="#090d16" stroke="#4ade80" stroke-opacity="0.3" stroke-width="1"/>
        <text x="14" y="28" font-family="'SF Mono', monospace" font-size="11" fill="#4ade80">[Unit] anode-api</text>
        <text x="14" y="52" font-family="'SF Mono', monospace" font-size="10" fill="#94a3b8">MemoryMax=256M</text>
        <text x="14" y="74" font-family="'SF Mono', monospace" font-size="10" fill="#94a3b8">CPUQuota=200%</text>
        <text x="14" y="98" font-family="'SF Mono', monospace" font-size="10" fill="#38bdf8">AmbientCaps=drop</text>
        <text x="14" y="128" font-family="'SF Mono', monospace" font-size="11" fill="#22d3ee">● Active: 8.2ms</text>
      </g>

      <text x="18" y="304" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • 8ms cold boot time
      </text>
      <text x="18" y="328" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • 4.8MB RAM footprint
      </text>
      <text x="18" y="352" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12.5" fill="#cbd5e1" font-weight="500">
        • Direct Linux syscalls
      </text>
    </g>
  </g>

  <!-- Bottom Comparison Callout -->
  <g transform="translate(80, 615)">
    <rect width="1110" height="75" rx="12" fill="#0f172a" fill-opacity="0.8" stroke="#1e293b" stroke-width="1.2"/>
    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="700" fill="#38bdf8">
      Why Bare Metal Instead of Containers?
    </text>
    <text x="28" y="56" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
      Go already compiles to static standalone machine code. Anode removes the 200MB container daemon tax and runs your binary natively with full cgroup isolation.
    </text>
    <text x="960" y="44" font-family="'SF Mono', monospace" font-size="13" font-weight="700" fill="#22c55e">
      0% VIRTUAL TAX
    </text>
  </g>
</svg>
`;

// Slide 3: Developer Cockpit & CLI
const slide3Svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1270 760" width="1270" height="760">
  ${COMMON_DEFS}

  <rect width="1270" height="760" fill="url(#bgGrad)"/>
  <rect width="1270" height="760" fill="url(#grid)"/>

  <circle cx="200" cy="200" r="280" fill="#3b82f6" fill-opacity="0.10" filter="url(#glowBlue)"/>
  <circle cx="1000" cy="500" r="300" fill="#00add8" fill-opacity="0.12" filter="url(#glowCyan)"/>

  <!-- Header -->
  <g transform="translate(80, 60)">
    <rect width="250" height="32" rx="16" fill="#00add8" fill-opacity="0.12" stroke="#00add8" stroke-opacity="0.4" stroke-width="1"/>
    <text x="32" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" letter-spacing="1">
      DEVELOPER EXPERIENCE
    </text>

    <text x="0" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="-1.2">
      Zero Infrastructure Overhead. Just Write Go.
    </text>
    <text x="0" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="17" font-weight="400" fill="#94a3b8">
      Run <tspan fill="#38bdf8" font-family="'SF Mono', monospace">anode dev</tspan> — instant hot reload in under 15ms with automated service discovery.
    </text>
  </g>

  <!-- Dual Split Panes -->
  <g transform="translate(80, 195)">
    <!-- Left Pane: Code Editor -->
    <g transform="translate(0, 0)">
      <rect width="540" height="490" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Header bar -->
      <path d="M 0 14 C 0 6.268 6.268 0 14 0 L 526 0 C 533.732 0 540 6.268 540 14 L 540 44 L 0 44 Z" fill="#090d16"/>
      <line x1="0" y1="44" x2="540" y2="44" stroke="#1e293b"/>
      <circle cx="22" cy="22" r="5.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="38" cy="22" r="5.5" fill="#f59e0b" opacity="0.8"/>
      <circle cx="54" cy="22" r="5.5" fill="#10b981" opacity="0.8"/>
      <text x="80" y="27" font-family="'SF Mono', monospace" font-size="12" fill="#94a3b8">cmd/api/main.go</text>

      <!-- Code Content -->
      <g transform="translate(26, 75)" font-family="'SF Mono', monospace" font-size="12.5" line-height="1.6">
        <text x="0" y="0" fill="#a78bfa">package</text>
        <text x="65" y="0" fill="#ffffff">main</text>

        <text x="0" y="30" fill="#a78bfa">import</text>
        <text x="55" y="30" fill="#cbd5e1">(</text>
        <text x="20" y="54" fill="#38bdf8">"net/http"</text>
        <text x="20" y="78" fill="#38bdf8">"github.com/jackc/pgx/v5"</text>
        <text x="0" y="102" fill="#cbd5e1">)</text>

        <text x="0" y="140" fill="#64748b">// Anode statically detects pgx and binds local DB</text>
        <text x="0" y="164" fill="#a78bfa">func</text>
        <text x="40" y="164" fill="#38bdf8">main</text>
        <text x="75" y="164" fill="#cbd5e1">() {</text>

        <text x="20" y="196" fill="#cbd5e1">db, _ := pgx.Connect(ctx, os.Getenv(</text>
        <text x="325" y="196" fill="#34d399">"DATABASE_URL"</text>
        <text x="440" y="196" fill="#cbd5e1">))</text>

        <text x="20" y="230" fill="#64748b">// Inferred route: POST /orders on port 8080</text>
        <text x="20" y="254" fill="#cbd5e1">http.HandleFunc(</text>
        <text x="145" y="254" fill="#34d399">"/orders"</text>
        <text x="220" y="254" fill="#cbd5e1">, handleOrders(db))</text>

        <text x="20" y="288" fill="#cbd5e1">http.ListenAndServe(</text>
        <text x="175" y="288" fill="#34d399">":8080"</text>
        <text x="235" y="288" fill="#cbd5e1">, nil)</text>

        <text x="0" y="320" fill="#cbd5e1">}</text>
      </g>

      <!-- Bottom badge -->
      <g transform="translate(26, 430)">
        <rect width="488" height="36" rx="8" fill="#00add8" fill-opacity="0.1" stroke="#00add8" stroke-opacity="0.3"/>
        <text x="16" y="23" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="600" fill="#38bdf8">
          ✓ No Dockerfile • No docker-compose.yml • Pure standard Go
        </text>
      </g>
    </g>

    <!-- Right Pane: Terminal Running anode dev -->
    <g transform="translate(570, 0)">
      <rect width="540" height="490" rx="14" fill="url(#cardGrad)" stroke="#00add8" stroke-opacity="0.4" stroke-width="1.5"/>
      <!-- Header bar -->
      <path d="M 0 14 C 0 6.268 6.268 0 14 0 L 526 0 C 533.732 0 540 6.268 540 14 L 540 44 L 0 44 Z" fill="#090d16"/>
      <line x1="0" y1="44" x2="540" y2="44" stroke="#1e293b"/>
      <circle cx="22" cy="22" r="5.5" fill="#ef4444" opacity="0.8"/>
      <circle cx="38" cy="22" r="5.5" fill="#f59e0b" opacity="0.8"/>
      <circle cx="54" cy="22" r="5.5" fill="#10b981" opacity="0.8"/>
      <text x="80" y="27" font-family="'SF Mono', monospace" font-size="12" fill="#94a3b8">anode dev (local cockpit)</text>

      <!-- Terminal Output -->
      <g transform="translate(26, 75)" font-family="'SF Mono', monospace" font-size="12.5" line-height="1.6">
        <text x="0" y="0" fill="#38bdf8" font-weight="700">$ anode dev</text>
        <text x="0" y="28" fill="#64748b">⚡ Initializing Proof-of-Topology watcher...</text>
        
        <text x="0" y="60" fill="#34d399">✔</text>
        <text x="20" y="60" fill="#ffffff">SSA call graph resolved in</text>
        <text x="240" y="60" fill="#22d3ee" font-weight="700">48ms</text>

        <text x="0" y="88" fill="#34d399">✔</text>
        <text x="20" y="88" fill="#ffffff">Discovered Ingress:</text>
        <text x="180" y="88" fill="#38bdf8">POST /orders (port :8080)</text>

        <text x="0" y="116" fill="#34d399">✔</text>
        <text x="20" y="116" fill="#ffffff">Binding Database:</text>
        <text x="170" y="116" fill="#a78bfa">Postgres 16 (auto_prov)</text>

        <text x="0" y="144" fill="#34d399">✔</text>
        <text x="20" y="144" fill="#ffffff">Loopback Mesh:</text>
        <text x="150" y="144" fill="#34d399">127.0.0.1:5432 virtualized</text>

        <rect x="0" y="172" width="488" height="65" rx="8" fill="#00add8" fill-opacity="0.08" stroke="#00add8" stroke-opacity="0.3"/>
        <circle cx="16" cy="196" r="4" fill="#22c55e"/>
        <text x="30" y="200" fill="#38bdf8" font-size="12" font-weight="700">READY • LISTENING ON http://localhost:8080</text>
        <text x="16" y="222" fill="#94a3b8" font-size="11.5">Zero port collision guarantee enabled. Watching for changes...</text>

        <!-- Change detection trigger -->
        <text x="0" y="268" fill="#f59e0b">● [HOT-RELOAD]</text>
        <text x="125" y="268" fill="#cbd5e1">Modified cmd/api/main.go</text>
        <text x="0" y="294" fill="#64748b">  └─ Delta SSA rebuilt in</text>
        <text x="195" y="294" fill="#4ade80" font-weight="700">12ms</text>
        <text x="0" y="318" fill="#64748b">  └─ PID 19280 restarted cleanly (4.9MB RAM)</text>

        <text x="0" y="360" fill="#4ade80">$</text>
        <text x="16" y="360" fill="#cbd5e1">curl http://localhost:8080/orders</text>
        <text x="0" y="386" fill="#22d3ee">{"status":"ok","order_id":"ord_9921","anode":true}</text>
      </g>
    </g>
  </g>
</svg>
`;

// Slide 4: Real-World Benchmarks
const slide4Svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1270 760" width="1270" height="760">
  ${COMMON_DEFS}

  <rect width="1270" height="760" fill="url(#bgGrad)"/>
  <rect width="1270" height="760" fill="url(#grid)"/>

  <circle cx="260" cy="200" r="280" fill="#059669" fill-opacity="0.10" filter="url(#glowCyan)"/>
  <circle cx="1020" cy="460" r="300" fill="#00add8" fill-opacity="0.10" filter="url(#glowBlue)"/>

  <!-- Header -->
  <g transform="translate(80, 60)">
    <rect width="250" height="32" rx="16" fill="#34d399" fill-opacity="0.12" stroke="#34d399" stroke-opacity="0.4" stroke-width="1"/>
    <text x="32" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="12" font-weight="700" fill="#34d399" letter-spacing="1">
      HEAD-TO-HEAD BENCHMARKS
    </text>

    <text x="0" y="75" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="42" font-weight="800" fill="#ffffff" letter-spacing="-1.2">
      Anode vs Docker vs Kubernetes
    </text>
    <text x="0" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-size="17" font-weight="400" fill="#94a3b8">
      Measured on Ubuntu 24.04 LTS (AMD64 / ARM64) running identical Go microservices.
    </text>
  </g>

  <!-- 3 Benchmark Comparison Cards -->
  <g transform="translate(80, 190)">
    <!-- Benchmark 1: Cold Boot Time -->
    <g transform="translate(0, 0)">
      <rect width="350" height="420" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="20" y="20" width="110" height="26" rx="6" fill="#00add8" fill-opacity="0.15"/>
      <text x="32" y="37" font-family="'SF Mono', monospace" font-size="11.5" font-weight="700" fill="#38bdf8">BENCHMARK 01</text>
      
      <text x="20" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="700" fill="#ffffff">
        Cold Boot Time
      </text>
      <text x="20" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
        Lower is better (Milliseconds)
      </text>

      <!-- Bar 1: Anode -->
      <g transform="translate(20, 140)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#38bdf8">Anode (Bare Metal)</text>
        <text x="260" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="800" fill="#22d3ee">8 ms</text>
        <rect x="0" y="10" width="22" height="24" rx="4" fill="#00add8"/>
      </g>

      <!-- Bar 2: Docker -->
      <g transform="translate(20, 205)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Docker Engine</text>
        <text x="245" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#f59e0b">450 ms</text>
        <rect x="0" y="10" width="160" height="24" rx="4" fill="#f59e0b" fill-opacity="0.6"/>
      </g>

      <!-- Bar 3: Kubernetes -->
      <g transform="translate(20, 270)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Kubernetes Pod</text>
        <text x="230" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#ef4444">2,100 ms</text>
        <rect x="0" y="10" width="310" height="24" rx="4" fill="#ef4444" fill-opacity="0.6"/>
      </g>

      <!-- Bottom takeaway -->
      <g transform="translate(20, 350)">
        <rect width="310" height="46" rx="8" fill="#00add8" fill-opacity="0.1" stroke="#00add8" stroke-opacity="0.25"/>
        <text x="14" y="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#38bdf8">
          🚀 56x Faster than Docker
        </text>
      </g>
    </g>

    <!-- Benchmark 2: Memory Footprint -->
    <g transform="translate(380, 0)">
      <rect width="350" height="420" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="20" y="20" width="110" height="26" rx="6" fill="#34d399" fill-opacity="0.15"/>
      <text x="32" y="37" font-family="'SF Mono', monospace" font-size="11.5" font-weight="700" fill="#34d399">BENCHMARK 02</text>
      
      <text x="20" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="700" fill="#ffffff">
        Memory Footprint
      </text>
      <text x="20" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
        Lower is better (Idle Megabytes)
      </text>

      <!-- Bar 1: Anode -->
      <g transform="translate(20, 140)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#34d399">Anode (systemd)</text>
        <text x="250" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="800" fill="#34d399">4.8 MB</text>
        <rect x="0" y="10" width="18" height="24" rx="4" fill="#34d399"/>
      </g>

      <!-- Bar 2: Docker -->
      <g transform="translate(20, 205)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Docker Engine</text>
        <text x="245" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#f59e0b">210 MB</text>
        <rect x="0" y="10" width="150" height="24" rx="4" fill="#f59e0b" fill-opacity="0.6"/>
      </g>

      <!-- Bar 3: Kubernetes -->
      <g transform="translate(20, 270)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Kubernetes Node</text>
        <text x="245" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#ef4444">850 MB</text>
        <rect x="0" y="10" width="310" height="24" rx="4" fill="#ef4444" fill-opacity="0.6"/>
      </g>

      <!-- Bottom takeaway -->
      <g transform="translate(20, 350)">
        <rect width="310" height="46" rx="8" fill="#34d399" fill-opacity="0.1" stroke="#34d399" stroke-opacity="0.25"/>
        <text x="14" y="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#34d399">
          ⚡ 44x Less RAM Consumed
        </text>
      </g>
    </g>

    <!-- Benchmark 3: Infrastructure Maintenance -->
    <g transform="translate(760, 0)">
      <rect width="350" height="420" rx="14" fill="url(#cardGrad)" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="20" y="20" width="110" height="26" rx="6" fill="#a855f7" fill-opacity="0.15"/>
      <text x="32" y="37" font-family="'SF Mono', monospace" font-size="11.5" font-weight="700" fill="#a78bfa">BENCHMARK 03</text>
      
      <text x="20" y="78" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="700" fill="#ffffff">
        Config Complexity
      </text>
      <text x="20" y="104" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">
        Files to write and maintain
      </text>

      <g transform="translate(20, 140)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#a78bfa">Anode</text>
        <text x="250" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="800" fill="#a78bfa">0 files</text>
        <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11.5" fill="#cbd5e1">Go code is single source of truth</text>
      </g>

      <g transform="translate(20, 205)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Docker</text>
        <text x="250" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#f59e0b">2 files</text>
        <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11.5" fill="#94a3b8">Dockerfile + docker-compose.yml</text>
      </g>

      <g transform="translate(20, 270)">
        <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="500" fill="#94a3b8">Kubernetes</text>
        <text x="240" y="0" font-family="'SF Mono', monospace" font-size="14" font-weight="700" fill="#ef4444">5+ YAMLs</text>
        <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11.5" fill="#94a3b8">Deploy, Svc, Ingress, Config, Secret</text>
      </g>

      <!-- Bottom takeaway -->
      <g transform="translate(20, 350)">
        <rect width="310" height="46" rx="8" fill="#a855f7" fill-opacity="0.1" stroke="#a855f7" stroke-opacity="0.25"/>
        <text x="14" y="28" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="700" fill="#a78bfa">
          🛡️ Zero Config Drift Ever
        </text>
      </g>
    </g>
  </g>

  <!-- Bottom Global Summary -->
  <g transform="translate(80, 635)">
    <rect width="1110" height="65" rx="10" fill="#0f172a" fill-opacity="0.8" stroke="#1e293b" stroke-width="1.2"/>
    <circle cx="24" cy="32" r="5" fill="#22d3ee"/>
    <text x="40" y="37" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="700" fill="#e2e8f0">
      Key Takeaway:
    </text>
    <text x="155" y="37" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="400" fill="#94a3b8">
      You gain 56x lower latency, 44x lower memory costs, and zero configuration overhead without changing a single line of your Go backend.
    </text>
  </g>
</svg>
`;

async function renderAll() {
  const slides = [
    { name: '01_hero_overview', svg: slide1Svg },
    { name: '02_architecture_pipeline', svg: slide2Svg },
    { name: '03_developer_cockpit', svg: slide3Svg },
    { name: '04_benchmark_comparison', svg: slide4Svg }
  ];

  for (const slide of slides) {
    const svgPath = path.join(OUTPUT_DIR, `${slide.name}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `${slide.name}.png`);
    
    fs.writeFileSync(svgPath, slide.svg.trim());
    
    // Render at 2540 x 1520 (@2x retina for 1270 x 760)
    await sharp(Buffer.from(slide.svg))
      .resize(2540, 1520)
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(pngPath);

    console.log(`✓ Rendered ${slide.name}.png (2540x1520 @2x)`);
  }
}

renderAll().catch(err => {
  console.error('Error rendering:', err);
  process.exit(1);
});
