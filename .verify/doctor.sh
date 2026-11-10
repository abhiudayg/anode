#!/usr/bin/env bash
set -euo pipefail

echo "=== Doctor: Checking Environment & Toolchain ==="

# 1. Check Go
if ! command -v go >/dev/null 2>&1; then
  echo "FAIL: go binary not found in PATH" >&2
  exit 1
fi
GO_VER=$(go version)
echo "✓ Go detected: $GO_VER"

# 2. Check Git
if ! command -v git >/dev/null 2>&1; then
  echo "FAIL: git binary not found in PATH" >&2
  exit 1
fi
GIT_VER=$(git version)
echo "✓ Git detected: $GIT_VER"

# 3. Check Workspace Readability
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ ! -f "$ROOT_DIR/go.mod" ]; then
  echo "FAIL: root go.mod not found at $ROOT_DIR" >&2
  exit 1
fi
echo "✓ Workspace valid: $ROOT_DIR"

# 4. Check Optional Container Runtimes (Docker / Podman)
if command -v docker >/dev/null 2>&1; then
  echo "✓ Docker runtime detected"
elif command -v podman >/dev/null 2>&1; then
  echo "✓ Podman runtime detected"
else
  echo "ℹ Notice: Neither docker nor podman detected (containerized databases will use fallback or manual port)"
fi

# 5. Check SSH Client (Required for anode deploy)
if command -v ssh >/dev/null 2>&1; then
  echo "✓ OpenSSH client detected"
else
  echo "FAIL: ssh binary not found (required for anode deploy)" >&2
  exit 1
fi

echo "=== Doctor: Environment Healthy ==="
exit 0
