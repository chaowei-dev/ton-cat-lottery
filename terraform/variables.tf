# GCP Project Configuration
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-east1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-east1-a"
}

# Network Configuration
variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "ton-cat-lottery-vpc"
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
  default     = "ton-cat-lottery-subnet"
}

variable "subnet_cidr" {
  description = "Subnet CIDR block"
  type        = string
  default     = "10.0.0.0/24"
}

# GKE Configuration
variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "ton-cat-lottery-cluster"
}

variable "namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "ton-cat-lottery"
}

# Container Registry
variable "registry_location" {
  description = "Artifact Registry location"
  type        = string
  default     = "asia-east1"
}

variable "repository_name" {
  description = "Artifact Registry repository name"
  type        = string
  default     = "ton-cat-lottery"
}

# DNS & SSL Configuration
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

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
  description = "Cloudflare zone ID"
  type        = string
}

variable "letsencrypt_email" {
  description = "Email for Let's Encrypt certificate registration"
  type        = string
}

# Service Account
variable "gke_service_account_name" {
  description = "GKE service account name"
  type        = string
  default     = "gke-service-account"
}

# Static IP
variable "static_ip_name" {
  description = "Static external IP name"
  type        = string
  default     = "ton-cat-lottery-ip"
}

# Environment
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Labels
variable "labels" {
  description = "Common labels to apply to all resources"
  type        = map(string)
  default = {
    project     = "ton-cat-lottery"
    managed-by  = "terraform"
  }
}