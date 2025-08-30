# Core GCP Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-east1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "asia-east1-a"
}

# Networking Configuration
variable "vpc_name" {
  description = "VPC Network name"
  type        = string
  default     = "ton-cat-lottery-vpc"
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
  default     = "ton-cat-lottery-subnet"
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
  default     = "10.0.0.0/16"
}

# GKE Configuration
variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "ton-cat-lottery-cluster"
}

variable "gke_release_channel" {
  description = "GKE release channel"
  type        = string
  default     = "REGULAR"
}

# DNS & SSL Configuration
variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "staging_subdomain" {
  description = "Staging subdomain"
  type        = string
  default     = "dev"
}

variable "monitoring_subdomain" {
  description = "Monitoring subdomain (optional)"
  type        = string
  default     = "monitoring"
}

# Cloudflare Configuration
variable "cloudflare_email" {
  description = "Cloudflare account email"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

# SSL Configuration
variable "letsencrypt_email" {
  description = "Let's Encrypt email for SSL certificates"
  type        = string
}

variable "ssl_issuer" {
  description = "SSL certificate issuer (letsencrypt-staging or letsencrypt-prod)"
  type        = string
  default     = "letsencrypt-prod"
}

# Environment Configuration
variable "environments" {
  description = "List of environments"
  type        = list(string)
  default     = ["production", "staging"]
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable monitoring infrastructure"
  type        = bool
  default     = true
}

variable "prometheus_storage_size" {
  description = "Prometheus storage size"
  type        = string
  default     = "10Gi"
}

variable "grafana_storage_size" {
  description = "Grafana storage size"
  type        = string
  default     = "5Gi"
}

# Resource Configuration
variable "resource_labels" {
  description = "Common resource labels"
  type        = map(string)
  default = {
    project     = "ton-cat-lottery"
    environment = "multi"
    managed-by  = "terraform"
  }
}