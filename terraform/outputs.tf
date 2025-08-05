# Cluster information
output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.primary.location
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = google_container_cluster.primary.master_auth.0.cluster_ca_certificate
  sensitive   = true
}

# Network information
output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

output "subnet_cidr" {
  description = "Subnet CIDR block"
  value       = google_compute_subnetwork.subnet.ip_cidr_range
}

# Static IP
output "static_ip_address" {
  description = "Static external IP address"
  value       = google_compute_address.static_ip.address
}

output "static_ip_name" {
  description = "Static external IP name"
  value       = google_compute_address.static_ip.name
}

# Service Account
output "gke_service_account_email" {
  description = "GKE service account email"
  value       = google_service_account.gke_service_account.email
}

# Artifact Registry
output "artifact_registry_repository" {
  description = "Artifact Registry repository URL"
  value       = "${var.registry_location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}

# Project information
output "project_id" {
  description = "GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP region"
  value       = var.region
}

# kubectl command
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.project_id}"
}

# Docker authentication command
output "docker_auth_command" {
  description = "Command to configure Docker authentication"
  value       = "gcloud auth configure-docker ${var.registry_location}-docker.pkg.dev"
}