# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "container.googleapis.com",
    "compute.googleapis.com",
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "servicenetworking.googleapis.com",
    "dns.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = true
  disable_on_destroy         = false
}

# Create VPC network
resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
  mtu                     = 1460

  depends_on = [google_project_service.apis]
}

# Create subnet
resource "google_compute_subnetwork" "subnet" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.vpc.id

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }

  depends_on = [google_project_service.apis]
}

# Create firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.network_name}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [var.subnet_cidr, var.pods_cidr, var.services_cidr]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "${var.network_name}-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["ssh"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "${var.network_name}-allow-http"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server", "https-server"]
}

# Create service account for GKE nodes
resource "google_service_account" "gke_service_account" {
  account_id   = "gke-${var.cluster_name}-sa"
  display_name = "Service Account for GKE cluster ${var.cluster_name}"
}

# Grant necessary IAM roles to the service account
resource "google_project_iam_member" "gke_service_account_roles" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/stackdriver.resourceMetadata.writer",
    "roles/storage.objectViewer",
    "roles/artifactregistry.reader"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_service_account.email}"
}

# Create static external IP for LoadBalancer
resource "google_compute_address" "static_ip" {
  name   = "${var.cluster_name}-static-ip"
  region = var.region
}

# Create GKE Autopilot cluster
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region

  # Enable Autopilot
  enable_autopilot = true

  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.subnet.id

  # IP allocation for secondary ranges
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }


  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  # Master authorized networks (allow all for now, restrict in production)
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks"
    }
  }

  # Release channel
  release_channel {
    channel = "REGULAR"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Maintenance policy
  maintenance_policy {
    daily_maintenance_window {
      start_time = "02:00"
    }
  }

  # Resource labels
  resource_labels = {
    environment = var.environment
    project     = "ton-cat-lottery"
  }

  depends_on = [
    google_project_service.apis,
    google_compute_subnetwork.subnet,
    google_service_account.gke_service_account,
    google_project_iam_member.gke_service_account_roles
  ]
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "ton-cat-lottery"
  description   = "Docker repository for TON Cat Lottery"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}