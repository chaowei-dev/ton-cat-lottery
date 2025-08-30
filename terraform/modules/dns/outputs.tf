output "production_record_id" {
  description = "Production DNS record ID"
  value       = cloudflare_record.production.id
}

output "staging_record_id" {
  description = "Staging DNS record ID"
  value       = cloudflare_record.staging.id
}

output "monitoring_record_id" {
  description = "Monitoring DNS record ID"
  value       = var.enable_monitoring ? cloudflare_record.monitoring[0].id : null
}

output "production_fqdn" {
  description = "Production FQDN"
  value       = cloudflare_record.production.hostname
}

output "staging_fqdn" {
  description = "Staging FQDN"
  value       = cloudflare_record.staging.hostname
}

output "monitoring_fqdn" {
  description = "Monitoring FQDN"
  value       = var.enable_monitoring ? cloudflare_record.monitoring[0].hostname : null
}