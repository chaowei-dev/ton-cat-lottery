output "secret_names" {
  description = "Names of created Secret Manager secrets"
  value = [
    google_secret_manager_secret.ton_config.secret_id,
    google_secret_manager_secret.wallet_private_key.secret_id,
    google_secret_manager_secret.cloudflare_token.secret_id,
    google_secret_manager_secret.database_url.secret_id
  ]
}

output "ton_config_secret_id" {
  description = "TON configuration secret ID"
  value       = google_secret_manager_secret.ton_config.secret_id
}

output "wallet_private_key_secret_id" {
  description = "Wallet private key secret ID"
  value       = google_secret_manager_secret.wallet_private_key.secret_id
}

output "cloudflare_token_secret_id" {
  description = "Cloudflare API token secret ID"
  value       = google_secret_manager_secret.cloudflare_token.secret_id
}

output "database_url_secret_id" {
  description = "Database URL secret ID"
  value       = google_secret_manager_secret.database_url.secret_id
}