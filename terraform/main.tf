# TON Cat Lottery - Terraform Infrastructure
# Single GKE cluster with dual environment namespaces

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  project_id    = var.project_id
  region        = var.region
  vpc_name      = var.vpc_name
  subnet_name   = var.subnet_name
  subnet_cidr   = var.subnet_cidr
  
  resource_labels = var.resource_labels
}

# GKE Module
module "gke" {
  source = "./modules/gke"
  
  project_id       = var.project_id
  region           = var.region
  cluster_name     = var.cluster_name
  vpc_name         = module.networking.vpc_name
  subnet_name      = module.networking.subnet_name
  release_channel  = var.gke_release_channel
  
  service_account_email = module.iam.gke_service_account_email
  
  resource_labels = var.resource_labels
  
  depends_on = [module.networking, module.iam]
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  project_id = var.project_id
  enable_workload_identity = false  # Will be enabled after GKE cluster exists
  
  resource_labels = var.resource_labels
}

# DNS Module
module "dns" {
  source = "./modules/dns"
  
  domain_name           = var.domain_name
  staging_subdomain     = var.staging_subdomain
  monitoring_subdomain  = var.monitoring_subdomain
  enable_monitoring     = var.enable_monitoring
  
  static_ip             = module.networking.static_ip
  
  cloudflare_zone_id    = var.cloudflare_zone_id
  
  depends_on = [module.networking]
}

# SSL Module - conditional deployment
module "ssl" {
  count  = var.enable_k8s_resources ? 1 : 0
  source = "./modules/ssl"
  
  domain_name        = var.domain_name
  staging_subdomain  = var.staging_subdomain
  letsencrypt_email  = var.letsencrypt_email
  ssl_issuer         = var.ssl_issuer
  static_ip          = module.networking.static_ip
  
  depends_on = [module.gke, module.namespaces]
}

# Namespaces Module
module "namespaces" {
  source = "./modules/namespaces"
  
  environments = var.environments
  
  depends_on = [module.gke]
}

# Secrets Module  
module "secrets" {
  source = "./modules/secrets"
  
  project_id = var.project_id
  region     = var.region
  
  depends_on = [module.gke]
}

# Monitoring Module (conditional)
module "monitoring" {
  count  = var.enable_monitoring ? 1 : 0
  source = "./modules/monitoring"
  
  prometheus_storage_size = var.prometheus_storage_size
  grafana_storage_size    = var.grafana_storage_size
  
  resource_labels = var.resource_labels
  
  depends_on = [module.gke, module.namespaces]
}