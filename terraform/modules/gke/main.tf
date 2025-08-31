# GKE Autopilot Cluster
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  # Enable Autopilot mode
  enable_autopilot = true

  # Network configuration
  network    = var.vpc_name
  subnetwork = var.subnet_name

  # IP allocation policy for secondary ranges
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Release channel
  release_channel {
    channel = var.release_channel
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Deletion protection (set to false for easier development)
  deletion_protection = false

  # Resource labels
  resource_labels = var.resource_labels
}