# Monitoring namespace
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
    labels = {
      name = "monitoring"
      "app.kubernetes.io/name"       = "monitoring"
      "app.kubernetes.io/component"  = "namespace"
      "app.kubernetes.io/managed-by" = "terraform"
    }
    
    annotations = {
      "description" = "Monitoring infrastructure for TON Cat Lottery"
    }
  }
}

# Persistent volume claims for Prometheus
resource "kubernetes_persistent_volume_claim" "prometheus_storage" {
  metadata {
    name      = "prometheus-storage"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels    = var.resource_labels
  }
  
  spec {
    access_modes = ["ReadWriteOnce"]
    
    resources {
      requests = {
        storage = var.prometheus_storage_size
      }
    }
    
    storage_class_name = "standard-rwo"
  }
}

# Persistent volume claims for Grafana
resource "kubernetes_persistent_volume_claim" "grafana_storage" {
  metadata {
    name      = "grafana-storage"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels    = var.resource_labels
  }
  
  spec {
    access_modes = ["ReadWriteOnce"]
    
    resources {
      requests = {
        storage = var.grafana_storage_size
      }
    }
    
    storage_class_name = "standard-rwo"
  }
}

# Service account for Prometheus
resource "kubernetes_service_account" "prometheus" {
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    labels    = var.resource_labels
  }
}

# ClusterRole for Prometheus
resource "kubernetes_cluster_role" "prometheus" {
  metadata {
    name   = "prometheus"
    labels = var.resource_labels
  }
  
  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "services", "endpoints", "pods"]
    verbs      = ["get", "list", "watch"]
  }
  
  rule {
    api_groups = ["extensions"]
    resources  = ["ingresses"]
    verbs      = ["get", "list", "watch"]
  }
  
  rule {
    api_groups = [""]
    resources  = ["configmaps"]
    verbs      = ["get"]
  }
  
  rule {
    non_resource_urls = ["/metrics"]
    verbs             = ["get"]
  }
}

# ClusterRoleBinding for Prometheus
resource "kubernetes_cluster_role_binding" "prometheus" {
  metadata {
    name   = "prometheus"
    labels = var.resource_labels
  }
  
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.prometheus.metadata[0].name
  }
  
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.prometheus.metadata[0].name
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }
}

# Resource quotas for monitoring namespace
resource "kubernetes_resource_quota" "monitoring_quota" {
  metadata {
    name      = "monitoring-quota"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }
  
  spec {
    hard = {
      "requests.cpu"    = "2"
      "requests.memory" = "4Gi"
      "limits.cpu"      = "4"
      "limits.memory"   = "8Gi"
      "persistentvolumeclaims" = "10"
      "pods"            = "20"
      "services"        = "10"
      "secrets"         = "20"
      "configmaps"      = "20"
    }
  }
}