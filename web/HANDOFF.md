# Engineering Handoff: Anode Web Redesign & Motion Architecture

**Repository:** `anode`  
**Working Directory:** `/Volumes/Seagate/developer/personal/anode/web`  
**Active Branch:** `web/v1.6.0`  
**Latest Commit:** `3565264e` (`feat(ui): add Roma-inspired glowing SVG arrow pipeline connecting execution stages`)  
**Deployment Target:** Production Static Export / Next.js SSR (`26/26` static pages generated)  
**Preview Port:** `http://localhost:3002`  

---

## 1. Executive Summary

This handoff documents the transformation of the **Anode** web presence into a developer-centric, minimalist platform. Drawing inspiration from modern high-performance design benchmarks (**Caveman.so** and **Roma.app**), the frontend has undergone complete visual stabilization, branding cleansing, motion re-architecture, and component streamlining.

All changes are built with **Next.js 16.4.6**, **React 19**, **Tailwind CSS v4**, **motion/react (v14)**, and **Lenis** smooth scrolling.

---

## 2. Key Architecture & Design Deliverables

### A. Strict Monochrome Aesthetic
- **Primary Canvas:** Deep black background (`#000000`) with subtle dot/grid overlays (`bg-grid-pattern`).
- **Surfaces & Cards:** High-contrast dark cards (`#08080a` to `#0a0a0c`) bordered by razor-thin translucent borders (`border-white/[0.08]` to `border-white/[0.14]`).
- **Semantic Accents Only:** Reserved strictly for functional statuses:
  - `emerald-400` / `#22c55e`: Determinism proofs, active states, successful verification checks.
  - `yellow-400` / `#eab308`: Warnings and build-time fallback diagnostic notices.
  - `red-400` / `#ef4444`: Errors, failure traps (e.g., Docker port collisions, drift risks).
- **Brand Cleanse:** Complete elimination of third-party template names (zero occurrences of `caveman`).
- **Typography & Versioning:** Plastered version numbers removed across the UI; consolidated into a single header announcement pill.

### B. Roma.app-Inspired Motion & Thread Architecture
1. **Authentic Roma Main Orange Arrow & Continuous Thread (`MainOrangeArrow.tsx`):**
   - **Signature Roma Palette:** Precision color tokens matching Roma.app CSS (`#ff7a4a` core, `#ff531a` glowing halo, `#ffd9c7` highlight).
   - **Continuous Conduit:** Flows seamlessly from Hero (`top-36`) through all sections down to the footer landing receptor.
   - **Leading Orange Arrow Runner:** A downward-pointing chevron arrow badge (`↓`) that rides the leading tip of the line with a 240px radial glow aura (`radial-gradient(circle, rgba(255, 83, 26, 0.42) 0%, transparent 70%)`) and intense neon bloom (`box-shadow: 0 0 16px 5px rgba(255, 83, 26, 0.85)`).
   - **Bidirectional Scroll Reactivity:** Built with Framer Motion `useScroll` and physics spring (`stiffness: 280, damping: 32`), advancing smoothly on scroll down all the way to the end of the site, and retracting in reverse on scroll up.
   - **Zero Clutter:** Replaced artificial segmented pills and green margin rails with the unified Roma continuous orange conduit.
2. **Sliding Spring Pill Tabs (`layoutId`):**
   - **Hero Install Switcher:** Morphing white background pill transitions between `brew tap`, `curl`, and `source` with zero latency (`stiffness: 450, damping: 32`).
   - **Interactive Terminal:** Glides seamlessly under active modes (`01 inspect`, `02 dev`, `03 lockfile`, `04 deploy`).
3. **Bidirectional Animated Empirical Counters (`AnimatedNumber.tsx`):**
   - **Physics Spring & Easing (`[0.16, 1, 0.3, 1]`):** Smooth count-up ticker animating empirical metrics from 0 to target values (`98%` less memory, `350x` faster startup, `850 MB` vs `14 MB`, `4,200 ms` vs `12 ms`).
   - **Bidirectional Scroll Reactivity (`once: false`):** Counts up smoothly when scrolled into the viewport, resets when scrolled out of view, and animates freshly on subsequent visits.
   - **SSR & SEO First:** Pre-renders target numbers in static HTML to ensure zero Cumulative Layout Shift (CLS) and indexability by search engines.
   - **Direct DOM Updating:** Updates `ref.current.textContent` during animation frames, avoiding React component re-rendering overhead and maintaining locked 60/120 FPS performance.
4. **Glowing SVG Execution Conduit:**
   - Vertical gradient conduit (`↓`) dropping from the terminal into the execution flow with looping tracer light pulses.
   - Horizontal animated SVG dashed vector arrows (`→`) with traveling light beacons connecting the 3 pipeline nodes (`01 Inspect` → `02 Dev` → `03 Deploy`).
   - Graceful fallback to centered downward conduits (`↓`) on mobile screens.
4. **Bidirectional Scroll Animations (`viewport: { once: false, amount: 0.15 }`):**
   - **Scrolling Down:** Elements slide and fade into view (`y: 24 -> 0`, custom cubic-bezier `[0.16, 1, 0.3, 1]`). Benchmark bars expand dynamically (Docker 850 MB, Anode 14 MB).
   - **Scrolling Up:** Animations reverse smoothly back to initial state as they exit the viewport.
   - **Scrolling Down Again:** Sections re-animate freshly on every subsequent pass.
5. **Interactive Spotlight Reflections:**
   - `SpotlightCard` component tracks cursor coordinates via radial gradients (`radial-gradient(600px circle at mouseX, mouseY, rgba(255,255,255,0.08), transparent 40%)`).

---

## 3. Route & Component Audit

### Complete Build Map (26 Static Pages Generated)
All 26 routes compile statically with zero hydration errors:

| Route Path | Description | Key Status |
| :--- | :--- | :--- |
| `/` | Primary Landing Page | Full Motion, Hero, Benchmarks, Drift, Pillars, FAQ, Footer |
| `/changelog` | Releases Timeline | Fixed single indicator rail dot, filtered categories |
| `/docs` | Documentation Hub | Static SSR documentation |
| `/blog` | Engineering Blog Index | High-contrast card grid |
| `/blog/inside-the-ssa-compiler-core` | Deep dive post | Clean editorial typography |
| `/blog/dynamicuser-sandboxing-without-root-daemons` | Deep dive post | Systemd isolation architecture |
| `/tools/compose-to-systemd` | Interactive Unit Synthesizer | Live code conversion engine |
| `/tools/ssa-visualizer` | AST Call Graph Explorer | Interactive SSA node viewer |
| `/vs/docker-compose` | Architectural Comparison | Redundant inline FAQs purged |
| `/vs/systemd` | Direct Comparison | Raw units vs Anode automation |
| `/deploy/digitalocean-droplet` | Bare-Metal Deploy Guide | Droplet setup without Docker |
| `/deploy/hetzner-vps` | Cloud VPS Deploy Guide | Hetzner Cloud optimization |
| `/guides/deploy-go-without-docker` | Foundational Guide | Net/http compilation pass |
| `/guides/deploy-gin-without-docker` | Framework Guide | Gin-gonic systemd setup |
| `/guides/deploy-chi-without-docker` | Framework Guide | Lightweight Chi deployment |
| `/guides/deploy-fiber-without-docker` | Framework Guide | High-throughput Fiber tuning |
| `/guides/deploy-go-postgres-vps` | Fullstack VPS Guide | Goose schema migration pairing |

### FAQ Section Containment
- **Homepage Exclusivity:** As requested, `<FAQSection />` is rendered **only** on `src/app/page.tsx` before the footer.
- **Subpage Purge:** Completely removed imports and JSX instances of `<FAQSection />` from all guides, deploy pages, comparison pages, and tools.

---

## 4. Changelog Timeline Stabilization

- **Issue Resolved:** The release timeline previously displayed a floating disconnected green dot alongside the active scroll dot for `v1.6.0`.
- **Root Cause:** A legacy `Timeline Anchor Ring` styled with `-left-[27px]` sat outside the timeline container and fired concurrently with the primary scroll-tracking traveling dot (`left-[10px]`).
- **Fix:** Purged the legacy anchor ring in `src/app/changelog/page.tsx`. Only the single glowing indicator dot centered directly on the `left-[15px]` vertical rail remains.

---

## 5. File Inventory & Critical Modifications

- **[Hero.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/Hero.tsx):**
  - Integrated `layoutId="install-method-pill"` for spring-animated installation selector.
  - Implemented vertical downward conduit (`↓`) and horizontal SVG pipeline arrows (`→`) with looping particle beams.
  - Value pillar cards updated to responsive pipeline nodes.
- **[InteractiveTerminal.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/InteractiveTerminal.tsx):**
  - Integrated `layoutId="terminal-active-pill"` for fluid tab switching across Inspect, Dev, Lockfile, and Deploy.
  - Added live status pulses and blinking command prompts.
- **[BenchmarkCharts.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/BenchmarkCharts.tsx):**
  - Added animated width expansion for RAM overhead (850 MB vs 14 MB) and cold boot (4,200 ms vs 12 ms) with `once: false` bidirectional scroll behavior.
- **[DriftComparison.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/DriftComparison.tsx):**
  - Side-by-side directional entry animations (`x: -28` / `x: 28`) with bidirectional scroll triggers.
- **[BentoPillars.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/BentoPillars.tsx):**
  - Staggered reveal animations for the 4 Topology Pillars with cursor-following spotlights.
- **[FAQSection.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/FAQSection.tsx):**
  - Framer Motion accordion with spring expansion, chevron rotation, and bidirectional scroll staggering.
- **[Footer.tsx](file:///Volumes/Seagate/developer/personal/anode/web/src/components/Footer.tsx):**
  - Pre-footer CTA animation, 5-column navigation grid, verified `/llms.txt` and GitHub links, and high-contrast watermark logo.

---

## 6. Verification Commands & Scripts

### Development & Build
```bash
# Enter project directory
cd /Volumes/Seagate/developer/personal/anode/web

# Development Server (Webpack Mode)
bun run dev

# Full Production Static Build
bun run build

# Start Production Server on port 3002
npx next start -p 3002
```

### Git Inspection
```bash
# View recent commits
git log -n 5 --oneline

# Verify sync with remote
git status
```

---

## 7. Recommended Next Steps

1. **Production Deployment:** Trigger deployment pipeline (e.g., Cloudflare Pages, Vercel, or standalone Linux VPS running Caddy).
2. **Telemetry / Analytics Integration:** Hook up privacy-friendly event tracking for copy-command clicks and tab interactions.
3. **OpenGraph Assets:** Finalize dynamic social preview card rendering for Twitter / LinkedIn sharing in `opengraph-image.png`.
