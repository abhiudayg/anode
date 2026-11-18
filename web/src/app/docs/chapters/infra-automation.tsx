"use client";


export default function ChapterInfraAutomation() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Infrastructure as Code
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Ansible & Terraform VM Automation
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Provision and configure testing environments or production bare-metal VPS instances with a single command using Anode&apos;s included IaC modules.
                  </p>

                  <h3 className="text-base font-bold text-white pt-2">1. One-Click Local VM Setup (OrbStack)</h3>
                  <p className="text-xs text-neutral-300">
                    Spins up an Ubuntu Linux VM, installs OpenSSH, synchronizes authorized keys, and tests live deployments:
                  </p>
                  <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                    <code>{`./scripts/setup-test-vm.sh anode-vm`}</code>
                  </pre>

                  <h3 className="text-base font-bold text-white pt-2">2. Ansible Playbook (infra/ansible/)</h3>
                  <p className="text-xs text-neutral-300">
                    Idempotent server orchestration configuring Caddy, Docker, Cgroups v2, and the unprivileged <code className="text-white">anode</code> user:
                  </p>
                  <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                    <code>{`ansible-playbook -i infra/ansible/inventory.ini infra/ansible/playbook.yml`}</code>
                  </pre>

                  <h3 className="text-base font-bold text-white pt-2">3. Terraform Cloud-Init (infra/terraform/)</h3>
                  <p className="text-xs text-neutral-300">
                    Prepares cloud instances (AWS EC2, Hetzner, DigitalOcean) with sysctl network tuning, OpenSSH, and Caddy:
                  </p>
                  <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                    <code>{`terraform -chdir=infra/terraform init
  terraform -chdir=infra/terraform apply`}</code>
                  </pre>
                </div>
  );
}
