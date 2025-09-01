variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "staging_subdomain" {
  description = "Staging subdomain"
  type        = string
}

variable "monitoring_subdomain" {
  description = "Monitoring subdomain"
  type        = string
}

variable "enable_monitoring" {
  description = "Enable monitoring subdomain"
  type        = bool
  default     = true
}

variable "static_ip" {
  description = "Static IP address for DNS records"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}