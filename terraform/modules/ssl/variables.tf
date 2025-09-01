variable "domain_name" {
  description = "Primary domain name"
  type        = string
}

variable "staging_subdomain" {
  description = "Staging subdomain"
  type        = string
}

variable "letsencrypt_email" {
  description = "Let's Encrypt email for SSL certificates"
  type        = string
}

variable "ssl_issuer" {
  description = "SSL certificate issuer (letsencrypt-staging or letsencrypt-prod)"
  type        = string
  default     = "letsencrypt-prod"
}

variable "static_ip" {
  description = "Static IP address for load balancer"
  type        = string
}