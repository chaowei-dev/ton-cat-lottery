# Project Information
output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "GCP Region"
  value       = var.region
}

# Networking Outputs
output "vpc_name" {
  description = "VPC Network name"
  value       = module.networking.vpc_name
}

output "subnet_name" {
  description = "Subnet name"
  value       = module.networking.subnet_name
}

output "static_ip" {
  description = "Static external IP address"
  value       = module.networking.static_ip
}

output "static_ip_name" {
  description = "Static external IP address name"
  value       = module.networking.static_ip_name
}

# GKE Cluster Outputs
output "cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = module.gke.cluster_ca_certificate
  sensitive   = true
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = module.gke.cluster_location
}

# DNS & Domain Outputs
output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

output "staging_domain" {
  description = "Staging domain"
  value       = "${var.staging_subdomain}.${var.domain_name}"
}

output "production_domain" {
  description = "Production domain"
  value       = var.domain_name
}

output "monitoring_domain" {
  description = "Monitoring domain (if enabled)"
  value       = var.enable_monitoring ? "${var.monitoring_subdomain}.${var.domain_name}" : null
}

# SSL Certificate Outputs
output "ssl_issuer" {
  description = "SSL certificate issuer"
  value       = var.ssl_issuer
}

# Namespace Outputs
output "namespaces" {
  description = "Created Kubernetes namespaces"
  value       = module.namespaces.namespace_names
}

# Service Account Outputs
output "gke_service_account_email" {
  description = "GKE service account email"
  value       = module.iam.gke_service_account_email
}

# Secret Manager Outputs
output "secret_names" {
  description = "Created Secret Manager secrets"
  value       = module.secrets.secret_names
}

# Monitoring Outputs
output "monitoring_enabled" {
  description = "Whether monitoring is enabled"
  value       = var.enable_monitoring
}

output "monitoring_namespace" {
  description = "Monitoring namespace"
  value       = var.enable_monitoring ? module.monitoring[0].monitoring_namespace : null
}

# kubectl Configuration Command
output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}

# Verification Commands
output "verification_commands" {
  description = "Commands to verify deployment"
  value = {
    cluster_health = "kubectl get nodes"
    ssl_certificates = "kubectl get certificates -A"
    dns_resolution = "dig ${var.domain_name}"
    https_test = "curl -I https://${var.domain_name}"
    namespaces = "kubectl get namespaces | grep -E '(tcl-production|tcl-staging|monitoring)'"
  }
}