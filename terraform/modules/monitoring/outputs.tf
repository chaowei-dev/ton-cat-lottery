output "monitoring_namespace" {
  description = "Monitoring namespace name"
  value       = kubernetes_namespace.monitoring.metadata[0].name
}

output "prometheus_storage_pvc" {
  description = "Prometheus storage PVC name"
  value       = kubernetes_persistent_volume_claim.prometheus_storage.metadata[0].name
}

output "grafana_storage_pvc" {
  description = "Grafana storage PVC name"
  value       = kubernetes_persistent_volume_claim.grafana_storage.metadata[0].name
}

output "prometheus_service_account" {
  description = "Prometheus service account name"
  value       = kubernetes_service_account.prometheus.metadata[0].name
}

output "prometheus_cluster_role" {
  description = "Prometheus cluster role name"
  value       = kubernetes_cluster_role.prometheus.metadata[0].name
}

output "resource_quota" {
  description = "Monitoring resource quota name"
  value       = kubernetes_resource_quota.monitoring_quota.metadata[0].name
}