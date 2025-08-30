# DNS A record for production domain
resource "cloudflare_record" "production" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  value   = var.static_ip
  type    = "A"
  ttl     = 300
  proxied = false  # Direct to IP, not through Cloudflare proxy
  
  comment = "TON Cat Lottery Production"
}

# DNS A record for staging subdomain
resource "cloudflare_record" "staging" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.staging_subdomain}.${var.domain_name}"
  value   = var.static_ip
  type    = "A"
  ttl     = 300
  proxied = false
  
  comment = "TON Cat Lottery Staging"
}

# DNS A record for monitoring subdomain (optional)
resource "cloudflare_record" "monitoring" {
  count   = var.enable_monitoring ? 1 : 0
  
  zone_id = var.cloudflare_zone_id
  name    = "${var.monitoring_subdomain}.${var.domain_name}"
  value   = var.static_ip
  type    = "A"
  ttl     = 300
  proxied = false
  
  comment = "TON Cat Lottery Monitoring"
}