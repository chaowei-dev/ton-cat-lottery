# Create namespaces for different environments
resource "kubernetes_namespace" "environments" {
  for_each = toset([for env in var.environments : "tcl-${env}"])
  
  metadata {
    name = each.value
    labels = {
      name        = each.value
      environment = split("-", each.value)[1] # Extract environment from tcl-production -> production
      "app.kubernetes.io/name"       = "ton-cat-lottery"
      "app.kubernetes.io/component"  = "namespace"
      "app.kubernetes.io/managed-by" = "terraform"
    }
    
    annotations = {
      "description" = "TON Cat Lottery ${split("-", each.value)[1]} environment"
    }
  }
}

# Resource quotas for production namespace
resource "kubernetes_resource_quota" "production" {
  count = contains(var.environments, "production") ? 1 : 0
  
  metadata {
    name      = "production-quota"
    namespace = "tcl-production"
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
  
  depends_on = [kubernetes_namespace.environments]
}

# Resource quotas for staging namespace
resource "kubernetes_resource_quota" "staging" {
  count = contains(var.environments, "staging") ? 1 : 0
  
  metadata {
    name      = "staging-quota"
    namespace = "tcl-staging"
  }
  
  spec {
    hard = {
      "requests.cpu"    = "1"
      "requests.memory" = "2Gi"
      "limits.cpu"      = "2"
      "limits.memory"   = "4Gi"
      "persistentvolumeclaims" = "5"
      "pods"            = "10"
      "services"        = "5"
      "secrets"         = "10"
      "configmaps"      = "10"
    }
  }
  
  depends_on = [kubernetes_namespace.environments]
}

# Network policies for production namespace (optional, enhanced security)
resource "kubernetes_network_policy" "production_isolation" {
  count = contains(var.environments, "production") ? 1 : 0
  
  metadata {
    name      = "production-isolation"
    namespace = "tcl-production"
  }
  
  spec {
    pod_selector {}
    
    policy_types = ["Ingress", "Egress"]
    
    ingress {
      from {
        namespace_selector {
          match_labels = {
            name = "ingress-nginx"
          }
        }
      }
      
      from {
        namespace_selector {
          match_labels = {
            name = "tcl-production"
          }
        }
      }
    }
    
    egress {
      # Allow all egress for now (can be restricted later)
    }
  }
  
  depends_on = [kubernetes_namespace.environments]
}