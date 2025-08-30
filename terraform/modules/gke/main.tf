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

  # Network policy is managed automatically in Autopilot mode

  # Private cluster config
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
    
    master_global_access_config {
      enabled = true
    }
  }

  # Master authorized networks (allow all for simplicity)
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks"
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Enable Binary Authorization (security best practice)
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Database encryption (optional, using Google-managed keys)
  database_encryption {
    state    = "ENCRYPTED"
    key_name = ""
  }

  # Shielded nodes are enabled by default in Autopilot

  # Maintenance policy
  maintenance_policy {
    recurring_window {
      start_time = "2023-01-01T04:00:00Z"
      end_time   = "2023-01-01T08:00:00Z"
      recurrence = "FREQ=WEEKLY;BYDAY=SA"
    }
  }

  # Deletion protection (set to false for easier development)
  deletion_protection = false

  # Addons configuration
  addons_config {
    http_load_balancing {
      disabled = false
    }
    
    horizontal_pod_autoscaling {
      disabled = false
    }
    
    # DNS cache and CSI drivers are managed automatically in Autopilot
  }

  # Logging and monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
    
    managed_prometheus {
      enabled = true
    }
  }

  # Resource labels
  resource_labels = var.resource_labels

  # Lifecycle
  lifecycle {
    ignore_changes = [
      # Ignore changes to initial_node_count as it's managed by Autopilot
      initial_node_count,
    ]
  }
}