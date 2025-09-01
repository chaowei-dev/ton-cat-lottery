output "namespace_names" {
  description = "Names of created namespaces"
  value       = [for ns in kubernetes_namespace.environments : ns.metadata[0].name]
}

output "production_namespace" {
  description = "Production namespace name"
  value       = contains(var.environments, "production") ? "tcl-production" : null
}

output "staging_namespace" {
  description = "Staging namespace name"
  value       = contains(var.environments, "staging") ? "tcl-staging" : null
}

output "resource_quotas" {
  description = "Resource quota information"
  value = {
    production = contains(var.environments, "production") ? "production-quota" : null
    staging    = contains(var.environments, "staging") ? "staging-quota" : null
  }
}