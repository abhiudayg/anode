terraform {
  required_version = ">= 1.5.0"
}

# Local file rendering of cloud-init configuration
data "local_file" "cloud_init" {
  filename = "${path.module}/cloud-init.yaml"
}

output "cloud_init_content" {
  value       = data.local_file.cloud_init.content
  description = "Rendered cloud-init bootstrap payload for the target instance"
}
