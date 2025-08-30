output "gke_service_account_email" {
  description = "GKE service account email"
  value       = google_service_account.gke_sa.email
}

output "gke_service_account_id" {
  description = "GKE service account ID"
  value       = google_service_account.gke_sa.id
}

output "gha_service_account_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.gha_sa.email
}

output "gha_service_account_id" {
  description = "GitHub Actions service account ID"
  value       = google_service_account.gha_sa.id
}