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

# Workload Identity binding - moved to post-deployment manual step
# This requires GKE cluster to exist first, so it's configured manually after deployment:
# kubectl annotate serviceaccount default iam.gke.io/gcp-service-account=gke-service-account@PROJECT_ID.iam.gserviceaccount.com
# gcloud iam service-accounts add-iam-policy-binding gke-service-account@PROJECT_ID.iam.gserviceaccount.com \
#   --role roles/iam.workloadIdentityUser \
#   --member "serviceAccount:PROJECT_ID.svc.id.goog[default/default]"