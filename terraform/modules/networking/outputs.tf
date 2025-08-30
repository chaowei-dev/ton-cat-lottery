output "vpc_name" {
  description = "VPC Network name"
  value       = google_compute_network.vpc.name
}

output "vpc_self_link" {
  description = "VPC Network self link"
  value       = google_compute_network.vpc.self_link
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

output "subnet_self_link" {
  description = "Subnet self link"
  value       = google_compute_subnetwork.subnet.self_link
}

output "static_ip" {
  description = "Static external IP address"
  value       = google_compute_global_address.static_ip.address
}

output "static_ip_name" {
  description = "Static external IP address name"
  value       = google_compute_global_address.static_ip.name
}

output "pods_secondary_range_name" {
  description = "Secondary IP range name for pods"
  value       = "pods"
}

output "services_secondary_range_name" {
  description = "Secondary IP range name for services"
  value       = "services"
}