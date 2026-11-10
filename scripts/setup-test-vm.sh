#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# setup-test-vm.sh: Automated Linux Test VM Provisioner for Anode
# ==============================================================================

VM_NAME="${1:-anode-vm}"
SSH_KEY="${2:-$HOME/.ssh/id_ed25519.pub}"

echo "🚀 [Anode Test VM Setup] Initializing VM: ${VM_NAME}"

if command -v orb &>/dev/null; then
    echo "  ✓ OrbStack detected on macOS host."
    
    # Check if VM already exists
    if orb list | grep -q "${VM_NAME}"; then
        echo "  ✓ VM ${VM_NAME} is already running."
    else
        echo "  ⚙ Creating Ubuntu Linux VM (${VM_NAME})..."
        orb create ubuntu "${VM_NAME}"
    fi

    # Install OpenSSH server if needed
    echo "  ⚙ Installing OpenSSH server and configuring authorized keys..."
    orb -m "${VM_NAME}" sudo apt-get update -qq
    orb -m "${VM_NAME}" sudo apt-get install -y -qq openssh-server

    # Install local public key
    if [[ -f "${SSH_KEY}" ]]; then
        PUB_KEY=$(cat "${SSH_KEY}")
        orb -m "${VM_NAME}" bash -c "mkdir -p ~/.ssh /root/.ssh && echo '${PUB_KEY}' | tee -a ~/.ssh/authorized_keys /root/.ssh/authorized_keys >/dev/null && chmod 600 ~/.ssh/authorized_keys /root/.ssh/authorized_keys"
        orb -m "${VM_NAME}" bash -c "echo 'PermitRootLogin prohibit-password' | sudo tee /etc/ssh/sshd_config.d/root.conf >/dev/null && sudo systemctl restart ssh"
    fi

    VM_IP=$(orb list | grep "${VM_NAME}" | awk '{print $NF}')
    echo ""
    echo "=========================================================="
    echo " 🎉 Test VM Ready!"
    echo " Target: root@${VM_IP}"
    echo " Test Deploy:"
    echo "   ./anode deploy root@${VM_IP} ./testdata/sample-shop"
    echo "=========================================================="
else
    echo "  ℹ OrbStack CLI not found. To set up a remote VPS, run:"
    echo "    ansible-playbook -i '${VM_NAME},' infra/ansible/playbook.yml"
fi
