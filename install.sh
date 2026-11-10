#!/usr/bin/env bash
#
# Anode One-Line Installer
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/abhiudayg/anode/main/install.sh | bash
#

set -e

REPO="abhiudayg/anode"
LATEST_VERSION="v1.0.0"

echo ""
echo "  █████╗ ███╗   ██╗ ██████╗ ██████╗ ███████╗"
echo " ██╔══██╗████╗  ██║██╔═══██╗██╔══██╗██╔════╝"
echo " ███████║██╔██╗ ██║██║   ██║██║  ██║█████╗  "
echo " ██╔══██║██║╚██╗██║██║   ██║██║  ██║██╔══╝  "
echo " ██║  ██║██║ ╚████║╚██████╔╝██████╔╝███████╗"
echo " ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝"
echo ""
echo " Installing Anode — Bare-Metal Go Orchestration Engine"
echo " -----------------------------------------------------"

# 1. Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin) OS_NAME="darwin" ;;
    Linux)  OS_NAME="linux" ;;
    *)
        echo "❌ Error: Unsupported operating system: ${OS}"
        echo "   Anode currently supports Linux and macOS."
        exit 1
        ;;
esac

# 2. Detect Architecture
ARCH="$(uname -m)"
case "${ARCH}" in
    x86_64|amd64) ARCH_NAME="amd64" ;;
    arm64|aarch64) ARCH_NAME="arm64" ;;
    *)
        echo "❌ Error: Unsupported architecture: ${ARCH}"
        exit 1
        ;;
esac

echo "✓ Detected platform: ${OS_NAME}/${ARCH_NAME}"

# 3. Determine install destination
INSTALL_DIR="/usr/local/bin"
USE_SUDO=0

if [ ! -w "${INSTALL_DIR}" ]; then
    if command -v sudo >/dev/null 2>&1; then
        USE_SUDO=1
    else
        INSTALL_DIR="${HOME}/.local/bin"
        mkdir -p "${INSTALL_DIR}"
    fi
fi

TARGET_BIN="${INSTALL_DIR}/anode"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

BINARY_URL="https://github.com/${REPO}/releases/download/${LATEST_VERSION}/anode_${OS_NAME}_${ARCH_NAME}.tar.gz"

echo "⏳ Downloading Anode binary (${LATEST_VERSION})..."

DOWNLOADED=0
if command -v curl >/dev/null 2>&1; then
    if curl -fsSL "${BINARY_URL}" -o "${TMP_DIR}/anode.tar.gz" 2>/dev/null; then
        DOWNLOADED=1
    fi
elif command -v wget >/dev/null 2>&1; then
    if wget -q "${BINARY_URL}" -O "${TMP_DIR}/anode.tar.gz" 2>/dev/null; then
        DOWNLOADED=1
    fi
fi

if [ "${DOWNLOADED}" -eq 1 ]; then
    tar -xzf "${TMP_DIR}/anode.tar.gz" -C "${TMP_DIR}"
    if [ "${USE_SUDO}" -eq 1 ]; then
        echo "🔒 Installing to ${INSTALL_DIR} (requires sudo)..."
        sudo mv "${TMP_DIR}/anode" "${TARGET_BIN}"
        sudo chmod +x "${TARGET_BIN}"
    else
        mv "${TMP_DIR}/anode" "${TARGET_BIN}"
        chmod +x "${TARGET_BIN}"
    fi
else
    # Fallback to local build if Go toolchain is available
    if command -v go >/dev/null 2>&1; then
        echo "ℹ Release asset not yet available over network. Building from source via Go toolchain..."
        if [ -f "./cmd/anode/main.go" ]; then
            echo "✓ Compiling directly from local workspace repository..."
            go build -o "${TMP_DIR}/anode" ./cmd/anode
            if [ "${USE_SUDO}" -eq 1 ]; then
                sudo mv "${TMP_DIR}/anode" "${TARGET_BIN}"
                sudo chmod +x "${TARGET_BIN}"
            else
                mv "${TMP_DIR}/anode" "${TARGET_BIN}"
                chmod +x "${TARGET_BIN}"
            fi
        else
            go install "github.com/${REPO}/cmd/anode@latest"
            GOPATH_BIN="$(go env GOPATH)/bin"
            if [ -f "${GOPATH_BIN}/anode" ]; then
                cp "${GOPATH_BIN}/anode" "${TARGET_BIN}" 2>/dev/null || true
            fi
        fi
    else
        echo "❌ Failed to download release from ${BINARY_URL}"
        echo "   Please install Go or check https://github.com/${REPO}/releases"
        exit 1
    fi
fi

# Ensure TARGET_BIN exists
if [ -x "${TARGET_BIN}" ]; then
    echo ""
    echo "🎉 Anode installed successfully!"
    "${TARGET_BIN}" version || true
    echo ""
    echo "Quickstart:"
    echo "  anode inspect ./cmd/api    # Analyze Go code & emit anode.lock.json"
    echo "  anode dev                  # Run local dynamic dev with zero port collisions"
    echo "  anode deploy user@host     # Deploy production release via systemd & SSH"
    echo ""
else
    echo "⚠️ Installation completed, but anode binary is not in PATH."
    echo "   Ensure ${INSTALL_DIR} is in your \$PATH."
fi
