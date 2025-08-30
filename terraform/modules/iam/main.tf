# Service Account for GKE
resource "google_service_account" "gke_sa" {
  account_id   = "gke-service-account"
  display_name = "GKE Service Account"
  description  = "Service account for GKE cluster nodes"
  
  project = var.project_id
}

# IAM roles for GKE service account
resource "google_project_iam_member" "gke_sa_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/stackdriver.resourceMetadata.writer"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}

# Service Account for CI/CD (GitHub Actions)
resource "google_service_account" "gha_sa" {
  account_id   = "gha-deploy"
  display_name = "GitHub Actions Deploy"
  description  = "Service account for GitHub Actions CI/CD"
  
  project = var.project_id
}

# IAM roles for GitHub Actions service account
resource "google_project_iam_member" "gha_sa_roles" {
  for_each = toset([
    "roles/container.developer",
    "roles/storage.admin",
    "roles/artifactregistry.writer"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gha_sa.email}"
}

# Workload Identity binding for applications
resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.gke_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[default/default]"
}