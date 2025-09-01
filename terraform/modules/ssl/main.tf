# Install cert-manager using Helm
resource "helm_release" "cert_manager" {
  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  version          = "v1.13.2"
  namespace        = "cert-manager"
  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "global.leaderElection.namespace"
    value = "cert-manager"
  }

  wait = true
  timeout = 600
}

# ClusterIssuer for Let's Encrypt staging
resource "kubernetes_manifest" "letsencrypt_staging" {
  depends_on = [helm_release.cert_manager]

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = "letsencrypt-staging"
    }
    spec = {
      acme = {
        server = "https://acme-staging-v02.api.letsencrypt.org/directory"
        email  = var.letsencrypt_email
        privateKeySecretRef = {
          name = "letsencrypt-staging"
        }
        solvers = [
          {
            http01 = {
              ingress = {
                class = "nginx"
              }
            }
          }
        ]
      }
    }
  }
}

# ClusterIssuer for Let's Encrypt production
resource "kubernetes_manifest" "letsencrypt_prod" {
  depends_on = [helm_release.cert_manager]

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "ClusterIssuer"
    metadata = {
      name = "letsencrypt-prod"
    }
    spec = {
      acme = {
        server = "https://acme-v02.api.letsencrypt.org/directory"
        email  = var.letsencrypt_email
        privateKeySecretRef = {
          name = "letsencrypt-prod"
        }
        solvers = [
          {
            http01 = {
              ingress = {
                class = "nginx"
              }
            }
          }
        ]
      }
    }
  }
}

# Install nginx-ingress controller
resource "helm_release" "nginx_ingress" {
  name             = "nginx-ingress"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  version          = "4.8.3"
  namespace        = "ingress-nginx"
  create_namespace = true

  set {
    name  = "controller.service.type"
    value = "LoadBalancer"
  }

  set {
    name  = "controller.service.loadBalancerIP"
    value = var.static_ip
  }

  set {
    name  = "controller.service.annotations.cloud\\.google\\.com/load-balancer-type"
    value = "External"
  }

  set {
    name  = "controller.extraArgs.enable-ssl-passthrough"
    value = "true"
  }

  wait = true
  timeout = 600
}

# Certificate for production domain
resource "kubernetes_manifest" "production_certificate" {
  depends_on = [
    kubernetes_manifest.letsencrypt_staging,
    kubernetes_manifest.letsencrypt_prod
  ]

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "Certificate"
    metadata = {
      name      = "production-tls"
      namespace = "tcl-production"
    }
    spec = {
      secretName = "production-tls"
      issuerRef = {
        name = var.ssl_issuer
        kind = "ClusterIssuer"
      }
      dnsNames = [var.domain_name]
    }
  }
}

# Certificate for staging domain
resource "kubernetes_manifest" "staging_certificate" {
  depends_on = [
    kubernetes_manifest.letsencrypt_staging,
    kubernetes_manifest.letsencrypt_prod
  ]

  manifest = {
    apiVersion = "cert-manager.io/v1"
    kind       = "Certificate"
    metadata = {
      name      = "staging-tls"
      namespace = "tcl-staging"
    }
    spec = {
      secretName = "staging-tls"
      issuerRef = {
        name = var.ssl_issuer
        kind = "ClusterIssuer"
      }
      dnsNames = ["${var.staging_subdomain}.${var.domain_name}"]
    }
  }
}