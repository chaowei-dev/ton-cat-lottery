output "cert_manager_namespace" {
  description = "cert-manager namespace"
  value       = "cert-manager"
}

output "nginx_ingress_namespace" {
  description = "nginx-ingress namespace"
  value       = "ingress-nginx"
}

output "letsencrypt_staging_issuer" {
  description = "Let's Encrypt staging ClusterIssuer name"
  value       = "letsencrypt-staging"
}

output "letsencrypt_prod_issuer" {
  description = "Let's Encrypt production ClusterIssuer name"
  value       = "letsencrypt-prod"
}

output "production_tls_secret" {
  description = "Production TLS secret name"
  value       = "production-tls"
}

output "staging_tls_secret" {
  description = "Staging TLS secret name"
  value       = "staging-tls"
}