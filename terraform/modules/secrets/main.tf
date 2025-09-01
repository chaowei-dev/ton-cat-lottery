# Secret Manager secrets for application configuration
resource "google_secret_manager_secret" "ton_config" {
  secret_id = "ton-cat-lottery-config"
  project   = var.project_id
  
  replication {
    auto {}
  }
  
  labels = {
    app         = "ton-cat-lottery"
    environment = "multi"
    type        = "config"
  }
}

# Secret for TON wallet private key (placeholder)
resource "google_secret_manager_secret" "wallet_private_key" {
  secret_id = "ton-wallet-private-key"
  project   = var.project_id
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  
  labels = {
    app         = "ton-cat-lottery"
    environment = "multi"
    type        = "credentials"
  }
}

# Secret for Cloudflare API token (if needed for app)
resource "google_secret_manager_secret" "cloudflare_token" {
  secret_id = "cloudflare-api-token"
  project   = var.project_id
  
  replication {
    auto {}
  }
  
  labels = {
    app         = "ton-cat-lottery"
    environment = "multi"
    type        = "api-token"
  }
}

# Secret for database credentials (if needed later)
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  project   = var.project_id
  
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  
  labels = {
    app         = "ton-cat-lottery"
    environment = "multi"
    type        = "database"
  }
}