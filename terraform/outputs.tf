# GKE cluster outputs
output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.primary.location
}

# Network outputs
output "network_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "network_self_link" {
  description = "VPC network self link"
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

# Static IP outputs
output "static_ip_address" {
  description = "Static external IP address"
  value       = google_compute_address.static_ip.address
}

output "static_ip_name" {
  description = "Static external IP name"
  value       = google_compute_address.static_ip.name
}

# Service account outputs
output "gke_service_account_email" {
  description = "GKE service account email"
  value       = google_service_account.gke_service_account.email
}

# Artifact Registry outputs
output "artifact_registry_repository" {
  description = "Artifact Registry repository name"
  value       = google_artifact_registry_repository.docker_repo.name
}

output "artifact_registry_location" {
  description = "Artifact Registry repository location"
  value       = google_artifact_registry_repository.docker_repo.location
}

# Connection command for kubectl
output "kubectl_connection_command" {
  description = "Command to connect kubectl to the cluster"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${google_container_cluster.primary.location} --project ${var.project_id}"
}

# Docker repository URL
output "docker_repository_url" {
  description = "Docker repository URL for pushing images"
  value       = "${google_artifact_registry_repository.docker_repo.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}"
}