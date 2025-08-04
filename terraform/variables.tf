variable "project_id" {
  description = "GCP Project ID"
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

variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
  default     = "ton-cat-lottery-cluster"
}

variable "network_name" {
  description = "VPC network name"
  type        = string
  default     = "ton-cat-lottery-network"
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

variable "pods_cidr" {
  description = "Secondary range for pods"
  type        = string
  default     = "10.1.0.0/16"
}

variable "services_cidr" {
  description = "Secondary range for services"
  type        = string
  default     = "10.2.0.0/16"
}

variable "node_count" {
  description = "Number of nodes in the GKE cluster"
  type        = number
  default     = 1
}

variable "node_machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-standard-2"
}

variable "disk_size_gb" {
  description = "Disk size for nodes in GB"
  type        = number
  default     = 20
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}