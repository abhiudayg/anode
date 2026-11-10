# Homebrew Tap for Abhiuday's Tools (`abhiudayg/tap`)

This is the common Homebrew tap repository for all CLI applications and developer tools built by [Abhiuday](https://github.com/abhiudayg).

## How to Install Tools

### 1. Anode — Bare-Metal Go Orchestration Engine
Deploy unmodified Go backends to Linux VPS without Dockerfiles or Kubernetes.

```bash
# Add the tap
brew tap abhiudayg/tap

# Install Anode
brew install anode

# Or install in a single command
brew install abhiudayg/tap/anode
```

To install the latest development build from `main`:
```bash
brew install --HEAD abhiudayg/tap/anode
```

## Available Formulas

| Formula | Description | Install Command |
|---|---|---|
| [`anode`](Formula/anode.rb) | Bare-metal Go orchestration engine & 4-Pillar Proof of Topology | `brew install abhiudayg/tap/anode` |

## Updating

```bash
brew update
brew upgrade anode
```
