variable "vm_name" {
  type        = string
  description = "Name of the testing VM"
  default     = "anode-test-vm"
}

variable "vm_memory_mb" {
  type        = number
  description = "Memory allocated to VM in Megabytes"
  default     = 2048
}

variable "vm_cpus" {
  type        = number
  description = "Virtual CPU count for the VM"
  default     = 2
}

variable "ssh_public_key_path" {
  type        = string
  description = "Path to SSH public key for root/user authentication"
  default     = "~/.ssh/id_ed25519.pub"
}
