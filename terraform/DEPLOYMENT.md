# Terraform 部署指南

## 🎯 部署概述

TON Cat Lottery 的 Terraform 基礎設施已完成設計和配置驗證，採用模組化架構實現單一 GKE 集群雙環境部署。

### ✅ 已完成項目

1. **模組化架構設計** - 8個專門化模組
2. **環境配置檔案** - 完整的變數、輸出和 provider 配置
3. **核心模組實現** - networking, gke, dns, ssl, namespaces, secrets, iam, monitoring
4. **配置範本** - terraform.tfvars.example 
5. **階段式部署驗證** - networking → gke → 完整部署規劃測試
6. **基礎設施驗證** - 語法驗證和相依性檢查
7. **雙環境架構** - tcl-production, tcl-staging, monitoring namespaces

## 🏗️ 架構設計

```
Internet → Cloudflare DNS → Static IP → nginx-ingress → Services
          (域名解析)        (負載均衡)    (SSL終端)       (應用服務)

單一 GKE Autopilot 集群
├── cat-lottery.chaowei-liu.com → tcl-production namespace
├── dev.cat-lottery.chaowei-liu.com → tcl-staging namespace  
└── monitoring.cat-lottery.chaowei-liu.com → monitoring namespace
```

## 📁 檔案結構

```
terraform/
├── main.tf                      # 主要配置整合
├── backend.tf                   # 狀態管理 (GCS Bucket)
├── providers.tf                 # Provider 配置
├── variables.tf                 # 變數定義
├── outputs.tf                   # 輸出值
├── terraform.tfvars.example     # 環境變數範例
├── terraform.tfvars             # 實際變數值 (已配置)
└── modules/                     # 模塊化架構
    ├── networking/              # VPC + Static IP + Firewall
    ├── gke/                     # GKE Autopilot 集群
    ├── dns/                     # Cloudflare DNS 雙域名
    ├── ssl/                     # cert-manager + nginx-ingress
    ├── namespaces/              # 雙環境 + 資源配額
    ├── secrets/                 # Secret Manager
    ├── iam/                     # Service Accounts + RBAC
    └── monitoring/              # 監控基礎設施
```

## 🚀 部署流程 (準備就緒)

### 階段 1：網路基礎設施
```bash
cd terraform/
terraform apply -target=module.networking
```

### 階段 2：GKE 集群
```bash
terraform apply -target=module.iam -target=module.gke
```

### 階段 3：完整部署
```bash
terraform apply
```

### 階段 4：驗證部署
```bash
# 獲取 kubectl 配置
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1

# 驗證集群健康
kubectl get nodes
kubectl get namespaces | grep -E "(tcl-production|tcl-staging|monitoring)"
kubectl get certificates -A
```

## 🔧 配置資訊

- **專案**: ton-cat-lottery-dev-3
- **區域**: asia-east1
- **域名**: cat-lottery.chaowei-liu.com (production), dev.cat-lottery.chaowei-liu.com (staging)
- **靜態 IP**: 將自動分配並配置到 DNS
- **SSL**: Let's Encrypt 自動憑證管理

## ⚡ 預估資源

- **GKE Autopilot 集群**: 1個 (自動擴縮容)
- **靜態 IP**: 1個
- **DNS 記錄**: 3個 (production, staging, monitoring)
- **SSL 憑證**: 2個 (production, staging)
- **Namespaces**: 3個 (雙環境 + 監控)
- **Secret Manager**: 4個 secrets

## 🎉 部署狀態

**狀態**: ✅ 準備就緒，可開始實際部署
**配置驗證**: ✅ 通過
**階段式測試**: ✅ 通過
**DNS 配置**: ✅ 已設定 (cat-lottery.chaowei-liu.com + Cloudflare)

---

**下一步**: 執行實際的 Terraform 部署以建立基礎設施