# DevOps 相關說明

## 目錄
- [Docker](#docker)
- [GCP-設定](#gcp-設定)
- [Terraform](#terraform)
- [k8s GKE](#k8s-gke)
- [GitHub Action (CI/CD)](#github-action-cicd)

---
## Docker

### 簡介
TON Cat Lottery 使用 Docker 容器化部署，提供一致的開發和生產環境。前端和後端服務獨立運行，通過區塊鏈進行交互。

**主要特色：**
- 獨立服務部署：前後端各自獨立運行
- 健康檢查：自動監控服務狀態
- 環境變數管理：安全的配置管理
- 多階段建構：優化映像大小和安全性

### 架構
```
Frontend Container (React + Nginx) ←→ TON Blockchain ←→ Backend Container (Go Daemon)
```

**服務組成：**
- **frontend**: React + Vite + Nginx (端口 3000)
- **backend**: Go 語言後端守護進程 (無 HTTP 接口)

### 檔案結構
```
ton-cat-lottery/
├── docker/
│   ├── Dockerfile.backend     # Go 後端服務容器配置
│   ├── Dockerfile.frontend    # React 前端應用容器配置
│   └── nginx/
│       └── default.conf       # Nginx 配置檔案
├── docker-compose.yml         # 服務編排配置
├── .env.example               # 環境變數範例
├── .env                       # 實際環境變數
└── .dockerignore              # Docker 建構忽略規則
```

### 快速啟動
```bash
# 0. 前置檢查
docker --version && docker-compose --version  # 確認工具已安裝
ls docker/Dockerfile.frontend  # 確認前端 Dockerfile 存在

# 1. 設定環境變數
cp .env.example .env
vim .env  # 編輯必要配置

# 2. 驗證配置
docker-compose config  # 檢查 docker-compose.yml 語法

# 3. 啟動服務
docker-compose up --build -d

# 4. 驗證服務
curl -I http://localhost:3000
docker-compose ps
docker-compose logs frontend --tail=10  # 檢查前端日誌
```

**服務訪問：**
- Frontend: http://localhost:3000  
- Backend: 守護進程（無HTTP接口）

### 常用指令
```bash
# 服務管理
docker-compose ps                    # 查看服務狀態
docker-compose logs -f backend        # 查看日誌
docker-compose exec backend sh        # 進入容器
docker-compose restart backend        # 重啟服務

# 測試和清理
docker-compose config                 # 驗證配置
docker-compose down                   # 停止服務
docker-compose up --build -d          # 重新構建
docker system prune -a                # 清理未使用資源
```

### 故障排除
```bash
# 檢查服務狀態
docker-compose ps -a
docker-compose logs --tail=50 frontend

# 檢查環境變數
cat .env
docker-compose config

# 檢查埠佔用
lsof -i :3000
sudo kill -9 <PID>

# 容器安全檢查
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
docker inspect $(docker-compose ps -q frontend) | grep -E "User|SecurityOpt"

# 環境變數配置驗證
docker-compose exec frontend env | grep -E "(NODE_|VITE_)"
echo "Testing .env file:" && source .env && echo "✓ Environment loaded"

# 重置環境
docker-compose down -v --remove-orphans
docker system prune -a
docker-compose up --build -d
```

---
## GCP 設定
### 簡介
TON Cat Lottery 使用 Google Cloud Platform (GCP) 作為雲端基礎設施平台。本章節涵蓋 GCP 帳號設定、本地開發工具安裝，以及 Terraform 服務帳戶配置等必要的基礎設定。

**主要特色：**
- 完整的 GCP 開發環境設定
- Terraform 自動化基礎設施管理
- 服務帳戶權限最佳化配置
- 預算控制與成本管理
- 本地開發工具整合

### 架構
```
GCP Project (ton-cat-lottery-dev-3)
├── Compute Engine API
├── Container Registry API  
├── Kubernetes Engine API
├── Artifact Registry
│   └── tcl-repo (asia-east1)
├── Service Accounts
│   ├── terraform-service (Infrastructure管理)
│   └── default (應用執行)
└── IAM & Security
    ├── Budget Alerts ($70/月)
    └── API Keys Management
```

**認證流程：**
```
開發者 → gcloud CLI → GCP APIs
             ↓
服務帳戶 → terraform → 基礎設施資源
```

### 檔案結構
```
~/.config/gcp-keys/
└── terraform-service-account.json  # 服務帳戶金鑰 (權限600)

~/.config/gcloud/
├── configurations/                  # gcloud 配置
├── credentials                      # 使用者認證快取
└── access_tokens                   # 訪問令牌快取

project-root/
├── .env                           # GCP專案變數
├── .gcloudignore                  # 上傳排除檔案
└── terraform/
    └── terraform-service-account-key.json  # 服務帳戶金鑰備份
```

### 快速啟動
```bash
# 1. 安裝工具
brew install --cask google-cloud-cli
brew install terraform
gcloud components install kubectl

# 2. GCP 認證與專案設定
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. 建立 Terraform 服務帳戶
gcloud iam service-accounts create terraform-service --display-name="Terraform Service Account"

# 4. 分配權限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:terraform-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" --role="roles/editor"
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="serviceAccount:terraform-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" --role="roles/container.admin"

# 5. 下載金鑰
mkdir -p ~/.config/gcp-keys
gcloud iam service-accounts keys create ~/.config/gcp-keys/terraform-service-account.json --iam-account=terraform-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
chmod 600 ~/.config/gcp-keys/terraform-service-account.json

# 6. 建立 Artifact Registry
gcloud artifacts repositories create tcl-repo --repository-format=docker --location=asia-east1
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 6.1. 測試 Artifact Registry
docker pull hello-world:latest
docker tag hello-world:latest asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/tcl-repo/test:latest
docker push asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/tcl-repo/test:latest
echo "✅ Registry test successful"

# 6.2. 清理測試映像
gcloud artifacts docker images delete asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/tcl-repo/test:latest --quiet
docker rmi asia-east1-docker.pkg.dev/YOUR_PROJECT_ID/tcl-repo/test:latest hello-world:latest

# 7. 啟用必要 API
gcloud services enable cloudresourcemanager.googleapis.com container.googleapis.com compute.googleapis.com artifactregistry.googleapis.com iam.googleapis.com
```

#### 階段 5：安全性最佳實踐與預算管理
```bash
# 1. 服務帳戶金鑰安全存儲
# - 金鑰檔案已設定 600 權限 (僅擁有者可讀寫)
# - 存放在 ~/.config/gcp-keys/ (不納入版控)
# - 建議每 90 天輪替一次

# 2. 預算管理優化 (透過 GCP Console)
# 前往 Billing → Budgets & Alerts 設定：
# - 25% 閾值：通知告警
# - 50% 閾值：電子郵件 + Slack 通知
# - 75% 閾值：自動停止非關鍵服務
# - 90% 閾值：全面停止服務

# 3. API 服務啟用
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  container.googleapis.com \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com

# 4. 驗證完整設定
gcloud config list
gcloud auth list
```

### 常用指令
```bash
# 專案管理
gcloud config list
gcloud config set project NEW_PROJECT_ID
gcloud projects describe PROJECT_ID

# 認證管理
gcloud auth list
gcloud auth login
gcloud auth activate-service-account --key-file=PATH_TO_KEY_FILE

# 服務帳戶管理
gcloud iam service-accounts list
gcloud iam service-accounts describe SERVICE_ACCOUNT_EMAIL

# API 管理
gcloud services list --enabled
gcloud services enable container.googleapis.com
```

### 故障排除
#### 認證問題
```bash
# 問題：認證失效或過期
# 解決方案：重新認證
gcloud auth login
gcloud auth application-default login

# 問題：服務帳戶權限不足
# 檢查服務帳戶權限
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SERVICE_ACCOUNT"

# 問題：多個認證帳戶衝突
# 查看所有認證帳戶
gcloud auth list

# 設定預設帳戶
gcloud config set account ACCOUNT_EMAIL
```

#### 專案設定問題
```bash
# 問題：無法存取專案
# 檢查專案存在性
gcloud projects list --filter="projectId:YOUR_PROJECT_ID"

# 檢查當前使用者權限
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"

# 問題：API 服務未啟用 (常見於新專案)
# 檢查必要 API 狀態
gcloud services list --enabled --project=PROJECT_ID

# 先切回個人帳戶啟用 API (Service Account 權限可能不足)
gcloud auth login --account=YOUR_EMAIL@gmail.com
gcloud config set project PROJECT_ID

# 批次啟用所有必要 API
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  container.googleapis.com \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  cloudbuild.googleapis.com \
  servicenetworking.googleapis.com

# 再切回 Service Account 進行操作
gcloud auth activate-service-account --key-file ~/.config/gcp-keys/terraform-service-account.json
```

#### 服務帳戶問題
```bash
# 問題：服務帳戶金鑰無效
# 驗證金鑰檔案格式
cat terraform-service-account-key.json | jq '.'

# 測試服務帳戶認證
gcloud auth activate-service-account --key-file=terraform-service-account-key.json
gcloud auth list

# 問題：權限不足錯誤
# 檢查所需的最小權限集合：
# - Project Editor (或更細緻的權限)
# - Kubernetes Engine Admin
# - Service Account Admin
# - Compute Network Admin (如果需要建立 VPC)

# 透過 gcloud 添加權限 (需要 Project Owner 權限)
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
  --role="roles/editor"
```

#### 一般故障排除
```bash
# 檢查 gcloud 配置
gcloud info

# 重設 gcloud 配置
gcloud config configurations create NEW_CONFIG_NAME
gcloud config configurations activate NEW_CONFIG_NAME

# 更新 gcloud SDK
gcloud components update

# 檢查網路連接
gcloud compute networks list

# 清除本地快取
rm -rf ~/.config/gcloud/cache/
gcloud auth login
```


---
## Terraform
### 簡介
TON Cat Lottery 使用 Terraform 作為基礎設施即代碼 (Infrastructure as Code) 工具，自動化管理 GCP 雲端資源。透過 Terraform 可以一鍵部署完整的 Kubernetes 集群、網路架構、SSL 憑證和 DNS 配置。

**主要特色：**
- 完全自動化的基礎設施部署
- GKE Autopilot 集群管理
- Cloudflare DNS + Let's Encrypt SSL 自動配置
- VPC 網路與防火牆規則
- Artifact Registry 容器映像管理
- cert-manager + nginx-ingress 整合

### 架構
```
Internet → Cloudflare DNS → Static IP → Ingress Controller → Services (ClusterIP)
          (域名解析)        (負載均衡)    (SSL終端)       (應用服務)
```

**雙環境架構：**
```
Terraform State
├── GKE Autopilot Cluster (單一集群)
├── Static IP (單一IP)
├── VPC Network + Subnet  
├── Artifact Registry
├── cert-manager (SSL管理)
├── nginx-ingress (流量路由)
├── Namespaces
│   ├── tcl-production
│   └── tcl-staging  
└── DNS Records
    ├── cat-lottery.chaowei-liu.com → Production
    └── dev.cat-lottery.chaowei-liu.com → Staging
```

### 檔案結構
```
terraform/
├── main.tf                      # 主要配置整合
├── backend.tf                   # 狀態管理 (GCS Bucket)
├── providers.tf                 # Provider 配置
├── variables.tf                 # 變數定義
├── outputs.tf                   # 輸出值
├── terraform.tfvars.example     # 環境變數範例
├── terraform.tfvars             # 實際變數值 (不納入版控)
└── modules/                     # 模塊化架構
    ├── networking/              # VPC 和網路配置
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── gke/                     # GKE 集群配置
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── dns/                     # Cloudflare DNS 配置
    ├── ssl/                     # cert-manager 配置
    ├── namespaces/              # K8s Namespace 配置
    ├── secrets/                 # Secret Manager 配置
    └── iam/                     # IAM 權限配置
```

### 快速啟動
#### 階段 1：環境準備
```bash
# 1. 確保 GCP 服務帳戶已設定
gcloud auth activate-service-account --key-file=terraform-service-account-key.json

# 2. 複製並設定環境變數
cd terraform/
cp terraform.tfvars.example terraform.tfvars

# 3. 編輯 terraform.tfvars，填入必要配置
vim terraform.tfvars
```

### 快速啟動

#### 必填變數設定
```hcl
# terraform.tfvars
project_id = "your-gcp-project-id"
region     = "asia-east1"

# DNS & SSL 配置
domain_name          = "lottery.yourdomain.com"
cloudflare_email     = "your-email@example.com"
cloudflare_api_token = "your-cloudflare-api-token"
cloudflare_zone_id   = "your-cloudflare-zone-id"
letsencrypt_email    = "your-email@example.com"
```

#### 階段式部署流程
```bash
# 1. 環境準備
cd terraform/
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars  # 編輯必要設定

# 2. 初始化和狀態管理設定
terraform init
terraform validate

# 3. 階段式部署
# 階段 3a: 網路基礎設施
terraform apply -target=module.networking
echo "✅ Networking deployed"

# 階段 3b: GKE 集群
terraform apply -target=module.gke
echo "✅ GKE cluster deployed"

# 階段 3c: 完整部署
terraform apply
echo "✅ Full infrastructure deployed"

# 4. 獲取 GKE 憑證並驗證
gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw region)

# 5. 基礎設施驗證
kubectl get nodes  # GKE 集群健康
kubectl get certificates -A  # SSL 證書狀態
dig $(terraform output -raw domain_name)  # DNS 解析檢查
curl -I https://$(terraform output -raw domain_name)  # HTTPS 連接測試

# 6. 雙環境完整驗證
kubectl get namespaces | grep -E "(tcl-production|tcl-staging)"
kubectl get resourcequota -A
```

### 常用指令
#### 基本 Terraform 操作
```bash
# 初始化和驗證
terraform init
terraform validate
terraform fmt

# 部署管理
terraform plan
terraform apply
terraform apply -auto-approve
terraform destroy

# 狀態管理
terraform state list
terraform output
terraform refresh
```

```bash
# 特定資源操作
terraform plan -target=google_container_cluster.primary
terraform apply -target=google_container_cluster.primary

# 集群管理
gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw region)
kubectl cluster-info
kubectl get nodes -o wide

# SSL 和 DNS 驗證
kubectl get certificates -A
curl -I https://$(terraform output -raw domain_name)
```

### 故障排除
```bash
# 初始化失敗
rm -rf .terraform .terraform.lock.hcl
terraform init

# 權限檢查
gcloud services list --enabled --project=$(terraform output -raw project_id)

# 資源衝突
terraform import google_compute_network.vpc projects/PROJECT_ID/global/networks/NETWORK_NAME

# GKE 連接問題
gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw region)
kubectl cluster-info

# SSL 憑證問題
kubectl logs -n cert-manager deployment/cert-manager
kubectl describe clusterissuer letsencrypt-prod

# 檢查憑證申請狀態
kubectl get certificaterequests --all-namespaces
kubectl describe certificate YOUR_CERTIFICATE -n YOUR_NAMESPACE

# 手動觸發憑證續期
kubectl delete certificate YOUR_CERTIFICATE -n YOUR_NAMESPACE
# 重新套用 ingress 設定
```

#### DNS 配置問題
```bash
# 問題：DNS 記錄未生效
# 檢查 Cloudflare DNS 記錄
dig @8.8.8.8 your-domain.com
nslookup your-domain.com

# 檢查 DNS 傳播狀態
curl -s "https://dns.google/resolve?name=your-domain.com&type=A" | jq

# 問題：SSL 證書無效
# 檢查證書狀態
curl -vI https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### 狀態檔案問題
```bash
# 問題：狀態檔案損壞
# 從備份恢復
cp terraform.tfstate.backup terraform.tfstate

# 問題：狀態檔案鎖定
# 查看鎖定資訊並強制解鎖
terraform force-unlock LOCK_ID

# 問題：狀態檔案不同步
# 重新整理狀態
terraform refresh
terraform plan -refresh-only
```

#### 清理與重建
```bash
# 完全清理環境
terraform destroy -auto-approve

# 清理 Terraform 檔案
rm -rf .terraform .terraform.lock.hcl terraform.tfstate*

# 重新開始
terraform init
terraform plan
terraform apply

# 部分重建特定資源
terraform taint google_container_cluster.primary
terraform apply
```

---
## k8s GKE
### 簡介
TON Cat Lottery 使用 Google Kubernetes Engine (GKE) Autopilot 作為容器編排平台，透過微服務架構部署前端和後端應用。系統採用 nginx-ingress + cert-manager 實現 HTTPS 自動化，並整合 Cloudflare DNS 提供完整的生產級別服務。

**主要特色：**
- GKE Autopilot 自動化節點管理和擴縮容
- 微服務架構：前端 (React) + 後端 (Go) 分離部署
- HTTPS 自動化：Let's Encrypt + cert-manager 自動續期
- 安全最佳實踐：非 root 用戶、資源限制、網路隔離
- ConfigMap/Secret 配置管理
- 健康檢查和滾動更新

### 架構
```
Internet → Cloudflare DNS → Static IP → nginx-ingress → Services
                                                      ├── frontend-service (React dApp)
                                                      └── backend-service (Go Daemon)
```

**雙環境架構：**
```
單一 GKE Cluster (tcl-ingress-ip)
├── cat-lottery.chaowei-liu.com → tcl-production namespace
│   ├── frontend-deployment (replicas: 2) → React dApp
│   └── backend-deployment (replicas: 2) → Go 自動抽獎服務
└── dev.cat-lottery.chaowei-liu.com → tcl-staging namespace  
    ├── frontend-deployment (replicas: 1) → 測試版本
    └── backend-deployment (replicas: 1) → 測試配置
```

### 檔案結構（Kustomize 模式）
```
k8s/
├── base/                           # 基礎配置
│   ├── kustomization.yaml         # 基礎 Kustomize 配置
│   ├── namespace.yaml              # 命名空間定義
│   ├── frontend/
│   │   ├── deployment.yaml         # 前端 Deployment
│   │   └── service.yaml            # 前端 Service (ClusterIP)
│   └── backend/
│       ├── deployment.yaml         # 後端守護進程 Deployment
│       └── configmap.yaml          # 後端 ConfigMap（無 Service）
├── overlays/                       # 環境特定配置
│   ├── production/
│   │   ├── kustomization.yaml      # Production 覆蓋配置
│   │   ├── replica-patch.yaml      # 副本數調整
│   │   └── resource-patch.yaml     # 資源限制調整
│   └── staging/
│       ├── kustomization.yaml      # Staging 覆蓋配置
│       └── replica-patch.yaml      # 副本數調整
└── ingress/                        # 統一 Ingress 配置
    └── ingress.yaml                # 雙域名 Ingress 路由
```

### 快速啟動
#### 1. 環境準備和驗證
```bash
# 基礎設施確認
kubectl get nodes  # GKE 集群健康
kubectl get certificates -A  # SSL 證書狀態
gcloud artifacts repositories list --location=asia-east1  # Artifact Registry 確認
dig cat-lottery.chaowei-liu.com  # DNS 解析確認

# 雙環境 namespace 確認
kubectl get namespaces | grep -E "(tcl-production|tcl-staging)"

# Docker + GCP 設置
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1
gcloud auth configure-docker asia-east1-docker.pkg.dev
```

#### 2. 精簡 Docker 映像策略
```bash
# 統一映像標籤策略（commit hash only）
COMMIT_SHA=$(git rev-parse --short HEAD)
PROJECT_ID=$(gcloud config get-value project)

# Frontend 映像建構（多階段優化）
docker buildx build --platform linux/amd64 \
  -f docker/Dockerfile.frontend --target production \
  -t asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/frontend:$COMMIT_SHA \
  --push .

# 映像驗證
gcloud artifacts docker images list asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo --include-tags
```

#### 3. Kustomize 雙環境部署
```bash
# Production 環境部署
kubectl apply -k k8s/overlays/production
kubectl apply -f k8s/ingress/

# Staging 環境部署
kubectl apply -k k8s/overlays/staging

# 統一 Ingress 配置（雙域名）
kubectl apply -f k8s/ingress/ingress.yaml
```

#### 4. 應用安全和生產配置驗證
```bash
# Pod Security Context 檢查
kubectl describe pod -l app=frontend -n tcl-production | grep -A 5 "Security Context"

# Resource Limits 檢查
kubectl describe pod -l app=frontend -n tcl-production | grep -A 10 "Limits"

# 後端守護進程健康檢查（無 HTTP Service）
kubectl exec -n tcl-production deployment/backend -- /app/health-check

# 結構化日誌配置確認
kubectl logs -n tcl-production deployment/backend --tail=10 | head -1 | jq '.'
```

#### 5. 雙環境完整驗證
```bash
# 外部訪問測試
curl -I https://cat-lottery.chaowei-liu.com  # Production
curl -I https://dev.cat-lottery.chaowei-liu.com  # Staging

# 後端守護進程驗證（TON 合約監聽）
kubectl logs -n tcl-production deployment/backend | grep -i "contract|lottery"
kubectl get configmap backend-config -n tcl-production -o yaml | grep TON

# 服務連通性測試
kubectl get endpoints -n tcl-production  # 只有 frontend，backend 無 Service
```

#### 6. 效能和監控驗證（可選）
```bash
# Google Cloud Monitoring 集成確認
kubectl get pods -n kube-system | grep metrics-server
kubectl top nodes
kubectl top pods -n tcl-production

# 日誌收集和查詢測試
kubectl logs -n tcl-production deployment/frontend --tail=100 | wc -l
kubectl logs -n tcl-production deployment/backend --since=1h | grep -c ERROR

# HPA 自動擴縮容驗證
kubectl autoscale deployment frontend --cpu-percent=70 --min=1 --max=5 -n tcl-production
kubectl get hpa -n tcl-production

# 負載測試（簡單驗證）
echo "GET https://cat-lottery.chaowei-liu.com" | vegeta attack -duration=30s -rate=10 | vegeta report
```

#### 7. 本地 K8s 部署驗證（可選）
```bash
# kind 集群設置
kind create cluster --name tcl-test
kubectl config use-context kind-tcl-test

# 配置一致性驗證
kubectl apply --dry-run=client -k k8s/overlays/staging
echo "✅ Kustomize configuration valid"

# 本地部署測試（無外部服務依賴）
kubectl apply -k k8s/base
kubectl get pods --watch
```

### 常用指令
#### Pod 和 Deployment 管理
```bash
# 查看所有資源
kubectl get all -n ton-cat-lottery

# 查看 Pod 詳細資訊
kubectl describe pod POD_NAME -n ton-cat-lottery

# 查看 Pod 日誌
kubectl logs -f deployment/backend -n ton-cat-lottery
kubectl logs -f deployment/frontend -n ton-cat-lottery

# 進入 Pod 容器
kubectl exec -it deployment/backend -n ton-cat-lottery -- sh
kubectl exec -it deployment/frontend -n ton-cat-lottery -- sh

# 重啟 Deployment
kubectl rollout restart deployment/backend -n ton-cat-lottery
kubectl rollout restart deployment/frontend -n ton-cat-lottery

# 查看滾動更新狀態
kubectl rollout status deployment/backend -n ton-cat-lottery
kubectl rollout history deployment/backend -n ton-cat-lottery

# 配置管理
kubectl get configmap -n ton-cat-lottery
kubectl describe configmap backend-config -n ton-cat-lottery

# SSL 憑證管理
kubectl get certificate -n ton-cat-lottery
kubectl describe certificate ton-cat-lottery-tls -n ton-cat-lottery
kubectl get clusterissuer

# 映像更新與回滾
kubectl set image deployment/backend backend=asia-east1-docker.pkg.dev/PROJECT_ID/tcl-repo/backend:NEW_TAG -n ton-cat-lottery
kubectl rollout undo deployment/backend -n ton-cat-lottery

# 自動擴縮容管理
kubectl autoscale deployment backend --cpu-percent=70 --min=2 --max=10 -n ton-cat-lottery
kubectl get hpa -n ton-cat-lottery
kubectl top pods -n ton-cat-lottery
```

### 故障排除
#### Pod 啟動問題
```bash
# 問題：Pod 無法正常啟動
# 檢查 Pod 狀態和事件
kubectl get pods -n ton-cat-lottery
kubectl describe pod POD_NAME -n tcl-production | grep -A 5 "Events:"
kubectl logs POD_NAME -n tcl-production
gcloud container images list --repository=asia-east1-docker.pkg.dev/PROJECT_ID/tcl-repo

# 服務連接問題
kubectl get svc -n tcl-production
kubectl get endpoints backend-service -n tcl-production
kubectl exec -it deployment/frontend -n tcl-production -- curl -v http://backend-service

# Ingress 和 SSL 問題
kubectl get ingress -n tcl-production
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
kubectl describe certificate ton-cat-lottery-tls -n tcl-production

kubectl logs -n cert-manager deployment/cert-manager
curl -vI https://cat-lottery.chaowei-liu.com

# 資源和效能問題
kubectl top nodes
kubectl top pods -n tcl-production
kubectl get events -n tcl-production --sort-by=.metadata.creationTimestamp

# 配置問題
kubectl get configmap backend-config -n tcl-production -o yaml
kubectl exec -it deployment/backend -n tcl-production -- env | grep -E "(TON|LOTTERY|NFT)"
kubectl rollout restart deployment/backend -n tcl-production

# 清理和重建
kubectl delete deployment backend -n tcl-production
kubectl apply -f k8s/backend/deployment.yaml
kubectl delete pod -l app=backend -n tcl-production

# 日誌監控
kubectl logs -f deployment/backend -n tcl-production --tail=100
kubectl get events -n tcl-production --watch
```

---
## 基礎監控體系
### 簡介
TON Cat Lottery 採用輕量化監控方案，適合 Side Project 的最小可行監控。主要依賴 GCP 內建服務和 Kubernetes 原生健康檢查機制，實現成本可控的基礎監控體系。

**主要特色：**
- GCP Cloud Monitoring 整合（免費額度內使用）
- Kubernetes 原生健康檢查機制
- 成本預算告警和資源監控
- 結構化日誌和故障排除
- Email 告警通知系統

### 快速啟動
```bash
# 1. 基礎監控設置
kubectl top nodes
kubectl top pods --all-namespaces
kubectl get pods -o wide --all-namespaces

# 2. 健康檢查驗證
kubectl describe pod -l app=frontend -n tcl-production | grep -A 5 "Liveness\|Readiness"
curl -f http://frontend-service.tcl-production.svc.cluster.local/
kubectl exec -n tcl-production deployment/backend -- /app/health-check

# 3. 成本監控 (GCP Console)
# 訪問: https://console.cloud.google.com/billing/budgets
# 設定月度預算: $70, 告警: 50%/75%/90%/100%
kubectl top pods -n tcl-production
```

### 日誌管理
```bash
# 應用日誌
kubectl logs -n tcl-production deployment/frontend --tail=50
kubectl logs -f -n tcl-production -l app=backend --tail=100

# 系統事件
kubectl get events -n tcl-production --sort-by=.metadata.creationTimestamp

# GCP Cloud Logging (選用)
# 訪問: https://console.cloud.google.com/logs
# 查詢: resource.type="k8s_container" AND resource.labels.namespace_name="tcl-production"
```

### 告警設置
```bash
# GCP Console 設定
# Monitoring → Alerting → Create Policy
# Billing → Budgets → Create Budget

# Pod 狀態告警條件:
# - Pod 重啟次數 > 5 times/hour
# - Memory 使用率 > 80%
# - CPU 使用率 > 90%

# Slack 通知 (選用)
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert from TON Cat Lottery"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### 常用指令
```bash
# 監控檢查
kubectl cluster-info
kubectl top nodes
kubectl top pods --all-namespaces --sort-by=cpu
kubectl get events --field-selector type=Warning --all-namespaces
kubectl get pods -o wide --all-namespaces

# 日誌查詢
kubectl logs -l app=frontend -n tcl-production --tail=100
kubectl logs -l app=backend -n tcl-production --follow
kubectl logs -l app=backend -n tcl-production | grep -i error
kubectl describe pod POD_NAME -n tcl-production | grep -A 10 "Last State"
```

### 故障排除

#### 常見監控問題
```bash
# 問題：metrics-server 無法正常運作
# 檢查 metrics-server 狀態
kubectl get pods -n kube-system | grep metrics-server
kubectl logs -n kube-system deployment/metrics-server

# 問題：健康檢查失敗
# 檢查健康檢查配置
kubectl describe pod POD_NAME -n tcl-production | grep -A 5 "Liveness\|Readiness"

# 手動測試健康檢查
kubectl exec -n tcl-production POD_NAME -- /app/health-check
curl -f http://SERVICE_NAME.NAMESPACE.svc.cluster.local/health

# 問題：日誌無法查看
# 檢查 Pod 狀態
kubectl get pods -n tcl-production
kubectl describe pod POD_NAME -n tcl-production

# 檢查容器日誌驅動
kubectl logs POD_NAME -n tcl-production --previous
```

#### 成本監控問題
```bash
# 問題：成本預算告警未收到
# 檢查計費帳戶設定
gcloud beta billing accounts list
gcloud beta billing budgets list --billing-account=BILLING_ACCOUNT_ID

# 檢查告警策略
gcloud alpha monitoring policies list

# 問題：資源使用率過高
# 分析資源使用狀況
kubectl describe nodes | grep -A 5 "Allocated resources"
kubectl top pods --sort-by=cpu --all-namespaces
kubectl top pods --sort-by=memory --all-namespaces

# 調整資源配置
kubectl edit deployment backend -n tcl-production
kubectl edit deployment frontend -n tcl-production
```

---
## GitHub Action (CI/CD)
### 簡介
TON Cat Lottery 使用 GitHub Actions 實現完全自動化的 CI/CD 流程，採用 Workload Identity Federation (OIDC) 進行安全的 GCP 認證。系統支援程式碼品質檢查、自動化測試、Docker 映像建構與推送，以及 GKE 應用程式部署。

**主要特色：**
- 安全的 OIDC 認證：無需儲存 Service Account Key
- 多環境支援：智能合約、前端、後端全端測試
- 自動化部署：Docker 映像建構 + GKE 滾動更新
- 工作流程依賴：CI 成功後自動觸發 CD
- 完整的部署驗證與健康檢查

### 架構
```
Code Push → CI Workflow (測試+建構) → CD Workflow (部署+驗證)
           ├── 智能合約測試                 ├── 推送到 Artifact Registry
           ├── 前端建構測試                 ├── GKE 部署更新
           ├── 後端整合測試                 └── 部署狀態驗證
           └── Docker 映像建構
```

**環境管理：**
```
├── Staging (dev.cat-lottery.chaowei-liu.com)
│   ├── PR 建立時自動部署最新代碼
│   └── 用於功能測試和驗證
└── Production (cat-lottery.chaowei-liu.com)
    ├── main 分支合併時自動部署
    └── 滾動更新 + 自動回滾
```

### 檔案結構
```
.github/workflows/
├── ci.yml                           # CI 工作流程：測試與建構
└── cd.yml                           # CD 工作流程：部署與驗證

項目根目錄/
├── setup-gcp-oidc.sh               # OIDC 設定自動化腳本
└── .github/
    └── secrets/                     # GitHub Secrets 配置
        ├── GCP_WIF_PROVIDER          # Workload Identity Provider
        └── GCP_SERVICE_ACCOUNT       # Service Account Email
```

### 配置

#### 核心組件設定
- **OIDC 身份驗證**：執行 `setup-gcp-oidc.sh` 建立 GitHub 與 GCP 信任關係，配置 Workload Identity Pool
- **GitHub Secrets**：設定 `GCP_WIF_PROVIDER`、`GCP_SERVICE_ACCOUNT`、`PROJECT_ID`
- **環境保護**：使用 GitHub Environment 保護生產部署


#### 管理指令
- **工作流程監控**：`gh workflow list` 查看狀態、`gh run list` 查看執行記錄
- **手動部署**：`gh workflow run cd.yml` 觸發部署
- **日誌查看**：`gh run view RUN_ID --log` 檢視執行日誌
- **流程控制**：`gh run cancel RUN_ID` 取消執行中工作流程

#### OIDC 配置管理
```bash
# 檢查 Workload Identity 設定
gcloud iam workload-identity-pools list --location=global

# 檢查服務帳戶權限
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:gha-deploy@PROJECT_ID.iam.gserviceaccount.com"

# 測試 OIDC 認證
gcloud auth print-identity-token
```

#### 部署狀態檢查
```bash
# 檢查 GKE 部署狀態
kubectl rollout status deployment/backend -n tcl-production
kubectl rollout status deployment/frontend -n tcl-production

# 查看部署歷史
kubectl rollout history deployment/backend -n tcl-production

# 回滾部署
kubectl rollout undo deployment/backend -n tcl-production
```

### 故障排除
#### 工作流程失敗
```bash
# 問題：OIDC 認證失敗
# 檢查 Workload Identity 設定
gcloud iam workload-identity-pools describe github-pool --location=global

# 檢查服務帳戶設定
gcloud iam service-accounts describe gha-deploy@PROJECT_ID.iam.gserviceaccount.com

# 重新執行 OIDC 設定
./setup-gcp-oidc.sh
```

#### 部署失敗問題
```bash
# 問題：映像推送失敗
# 檢查 Artifact Registry 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 檢查映像存在
gcloud artifacts docker images list asia-east1-docker.pkg.dev/PROJECT_ID/tcl-repo

# 問題：GKE 部署失敗
# 檢查 kubectl 連接
gcloud container clusters get-credentials CLUSTER_NAME --region REGION
kubectl get nodes

# 檢查部署狀態
kubectl get pods -n tcl-production
kubectl describe deployment backend -n tcl-production
```

#### GitHub Secrets 問題
```bash
# 檢查必要的 GitHub Secrets
# GCP_WIF_PROVIDER
# GCP_SERVICE_ACCOUNT  
# PROJECT_ID

# 透過 GitHub CLI 設定 secrets
gh secret set GCP_WIF_PROVIDER --body "projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
gh secret set GCP_SERVICE_ACCOUNT --body "gha-deploy@PROJECT_ID.iam.gserviceaccount.com"
gh secret set PROJECT_ID --body "your-project-id"
```

---
## Monitoring 監控

