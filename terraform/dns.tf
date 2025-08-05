# Cloudflare DNS A record for the main domain
resource "cloudflare_record" "app_dns" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  content = google_compute_address.static_ip.address
  type    = "A"
  ttl     = 300
  comment = "TON Cat Lottery application - managed by Terraform"

  depends_on = [google_compute_address.static_ip]
}

# Optional: Cloudflare DNS A record for www subdomain
resource "cloudflare_record" "www_dns" {
  zone_id = var.cloudflare_zone_id
  name    = "www.${var.domain_name}"
  content = google_compute_address.static_ip.address
  type    = "A"
  ttl     = 300
  comment = "TON Cat Lottery application WWW - managed by Terraform"

  depends_on = [google_compute_address.static_ip]
}

# Optional: Cloudflare Page Rule to redirect www to non-www
resource "cloudflare_page_rule" "www_redirect" {
  zone_id  = var.cloudflare_zone_id
  target   = "www.${var.domain_name}/*"
  priority = 1

  actions {
    forwarding_url {
      url         = "https://${var.domain_name}/$1"
      status_code = 301
    }
  }

  depends_on = [cloudflare_record.www_dns]
}

# Cloudflare zone settings for security and performance
resource "cloudflare_zone_settings_override" "zone_settings" {
  zone_id = var.cloudflare_zone_id

  settings {
    # SSL/TLS settings
    ssl                      = "strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"

    # Security settings
    security_level = "medium"
    challenge_ttl  = 1800

    # Performance settings
    browser_check  = "on"
    hotlink_protection = "off"

    # Caching
    browser_cache_ttl = 14400
    cache_level       = "aggressive"
    
    # Development mode (set to off for production)
    development_mode = "off"

    # Brotli compression
    brotli = "on"

    # HTTP/2 and HTTP/3
    http2 = "on"
    http3 = "on"

    # IPv6
    ipv6 = "on"

    # Always Online
    always_online = "on"

    # Opportunistic Encryption
    opportunistic_encryption = "on"

    # Pseudo IPv4
    pseudo_ipv4 = "off"

    # Websockets
    websockets = "on"
  }
}

# Output DNS information
output "dns_records" {
  description = "DNS records created"
  value = {
    main_domain = {
      name  = cloudflare_record.app_dns.name
      value = cloudflare_record.app_dns.content
      type  = cloudflare_record.app_dns.type
    }
    www_domain = {
      name  = cloudflare_record.www_dns.name
      value = cloudflare_record.www_dns.content
      type  = cloudflare_record.www_dns.type
    }
  }
}