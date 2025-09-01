# DevOps 相關說明

## 目錄
- [Docker](#docker)
- [GCP 設定](#gcp-設定)
- [Terraform](#terraform)
- [k8s GKE](#k8s-gke)
- [GitHub Action (CI/CD)](#github-action-cicd)
- [Monitoring (Prometheus + Grafana)](#monitoring-prometheus--grafana)

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
ls docker/Dockerfile.backend   # 確認後端 Dockerfile 存在

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

# 容器驗證和優化
# 容器安全檢查
docker scan $(docker-compose ps -q backend) 2>/dev/null || echo "⚠️ Docker scan not available"
docker inspect $(docker-compose ps -q backend) | grep -E '"User":|"SecurityOpt":|"ReadonlyRootfs":'

# 效能檢查
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
docker system df  # 檢查 Docker 空間使用

# 環境變數配置驗證
docker-compose exec backend env | grep -E "(TON_|WALLET_|LOTTERY_)" || echo "ℹ️ Backend env vars not configured yet"
docker-compose exec frontend env | grep -E "(VITE_|NODE_)" | head -5
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

### 快速啟動
```bash
# 1. 安裝工具
brew install --cask google-cloud-cli
brew install terraform
gcloud components install kubectl

# 2. GCP 認證與專案設定
gcloud auth login
gcloud config set project ton-cat-lottery-dev-3

# 3. 建立 Terraform 服務帳戶
gcloud iam service-accounts create terraform-service --display-name="Terraform Service Account"

# 4. 分配權限
gcloud projects add-iam-policy-binding ton-cat-lottery-dev-3 --member="serviceAccount:terraform-service@ton-cat-lottery-dev-3.iam.gserviceaccount.com" --role="roles/editor"
gcloud projects add-iam-policy-binding ton-cat-lottery-dev-3 --member="serviceAccount:terraform-service@ton-cat-lottery-dev-3.iam.gserviceaccount.com" --role="roles/container.admin"
gcloud projects add-iam-policy-binding ton-cat-lottery-dev-3 --member="serviceAccount:terraform-service@ton-cat-lottery-dev-3.iam.gserviceaccount.com" --role="roles/iam.serviceAccountAdmin"

# 5. 下載金鑰
mkdir -p ~/.config/gcp-keys
gcloud iam service-accounts keys create ~/.config/gcp-keys/terraform-service-account.json --iam-account=terraform-service@ton-cat-lottery-dev-3.iam.gserviceaccount.com
chmod 600 ~/.config/gcp-keys/terraform-service-account.json

# 6. 啟用必要 API 服務
gcloud services enable cloudresourcemanager.googleapis.com container.googleapis.com compute.googleapis.com artifactregistry.googleapis.com iam.googleapis.com

# 7. 建立 Artifact Registry
gcloud artifacts repositories create tcl-repo --repository-format=docker --location=asia-east1
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 8. 測試 Registry 功能
docker pull hello-world:latest
docker tag hello-world:latest asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/test:latest
docker push asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/test:latest
echo "✅ Registry test successful"

# 9. 清理測試映像
gcloud artifacts docker images delete asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/test:latest --quiet
docker rmi asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/test:latest hello-world:latest
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

# 3. 驗證 API 服務狀態
gcloud services list --enabled --filter="name:(cloudresourcemanager|container|compute|artifactregistry|iam)" --format="table(name)"

# 4. 驗證完整設定
gcloud config list
gcloud auth list
gcloud artifacts repositories list --location=asia-east1
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
## Terraform 基礎設施
### 簡介
通過 Terraform 部署：

1. **GCP 基礎資源**：
    - VPC 網路、子網路、防火牆規則
    - GKE Autopilot 集群
    - 靜態 IP 地址
    - IAM 服務帳戶和權限

2. **DNS & SSL**：
    - Cloudflare DNS 記錄
    - Let's Encrypt SSL 證書管理

3. **K8s 基礎服務**：
    - cert-manager (SSL 證書自動化)
    - nginx-ingress (流量入口)
    - namespaces (環境隔離)
    - 資源配額和網路策略

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
│   ├── tcl-staging
│   └── monitoring (Prometheus + Grafana + AlertManager)
├── Persistent Storage
│   ├── prometheus-storage (時序數據庫)
│   └── grafana-storage (Dashboard 配置)
├── RBAC 權限
│   └── monitoring-rbac (Prometheus 讀取 K8s API)
└── DNS Records
    ├── cat-lottery.chaowei-liu.com → Production
    ├── dev.cat-lottery.chaowei-liu.com → Staging
    └── monitoring.cat-lottery.chaowei-liu.com → Grafana (可選)
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
├── DEPLOYMENT.md                # 部署指南
└── modules/                     # 模塊化架構
    ├── networking/              # VPC + Static IP + Firewall
    │   ├── main.tf, variables.tf, outputs.tf
    ├── gke/                     # GKE Autopilot 集群
    │   ├── main.tf, variables.tf, outputs.tf
    ├── dns/                     # Cloudflare DNS 雙域名
    │   ├── main.tf, variables.tf, outputs.tf, provider.tf
    ├── ssl/                     # cert-manager + nginx-ingress
    │   ├── main.tf, variables.tf, outputs.tf
    ├── namespaces/              # 雙環境 + 資源配額
    │   ├── main.tf, variables.tf, outputs.tf
    ├── secrets/                 # Secret Manager
    │   ├── main.tf, variables.tf, outputs.tf
    ├── iam/                     # Service Accounts + RBAC
    │   ├── main.tf, variables.tf, outputs.tf
    └── monitoring/              # 監控基礎設施
        ├── main.tf, variables.tf, outputs.tf
```

### 快速啟動

#### 部署架構說明
Terraform 管理所有基礎設施，包括通過 **Helm Provider** 部署複雜的 K8s 應用：

```
Terraform (基礎設施即代碼)
├── GCP Resources (VPC, GKE, DNS, IAM...)  
└── Helm Provider → 部署複雜的 K8s 應用
    ├── cert-manager (SSL 證書自動化)
    └── nginx-ingress (流量入口控制器)
```

**重要概念：**
- 你**不需要**手動執行 `helm install`
- Terraform 使用 `helm_release` 資源自動管理 Helm charts
- 所有部署都通過 `terraform apply` 完成
- Helm 只是 Terraform 用來部署複雜 K8s 應用的工具

**部署策略說明：**
- **cert-manager, nginx-ingress** → 使用 Helm Provider (複雜第三方應用)
- **namespaces, RBAC, 存儲** → 使用純 Kubernetes 資源 (自定義配置)
- **API 依賴** → Secret Manager API 需要手動啟用：`gcloud services enable secretmanager.googleapis.com`

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
###### 0. 前置檢查：確保 GCP 認證
```bash
gcloud auth list
gcloud config get-value project
gcloud auth activate-service-account --key-file ~/.config/gcp-keys/terraform-service-account.json
```

###### 1. 環境準備
```bash
# 編輯必要設定：domain_name, cloudflare_api_token, cloudflare_zone_id
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars  
```

######  2. 初始化和狀態管理設定
```bash
terraform init  # (下載 providers 和模組)
terraform validate  # (驗證配置語法)
```

######  3. 階段式部署（使用變數控制，解決 K8s 資源依賴問題）
```bash
# 階段 3a: 基礎設施部署（創建 GKE 集群和基礎設施，不含 K8s 資源)
terraform apply -var="enable_k8s_resources=false" -auto-approve

# 階段 3b: 配置 kubectl 連接 (配置本地 kubectl)
gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw region)

# 階段 3c: 啟用 K8s 資源部署 (部署 cert-manager, nginx-ingress, SSL 等)
# 注意：首次執行可能因為 cert-manager CRDs 未就緒而失敗，這是正常的
terraform apply -var="enable_k8s_resources=true" -auto-approve

# 階段 3d: 解決常見部署問題
# 如果遇到 Secret Manager API 錯誤，先啟用 API：
gcloud services enable secretmanager.googleapis.com --project=$(terraform output -raw project_id)

# 如果 cert-manager CRDs 錯誤，可以分步驟部署：
terraform apply -target="module.ssl[0].helm_release.cert_manager" -var="enable_k8s_resources=true" -auto-approve
# 等待 cert-manager pods 運行後，再執行完整部署：
terraform apply -var="enable_k8s_resources=true" -auto-approve
```

###### 4. 基礎設施驗證
```bash
# 4a. GKE 集群健康檢查
kubectl get nodes  
# 預期結果：Autopilot 模式顯示 "No resources found" 是正常的

# 4b. Namespace 檢查 (應該看到 3 個 namespace)
kubectl get namespaces | grep -E "(tcl-production|tcl-staging|monitoring)"
# 預期結果：
# tcl-production   Active   Xm
# tcl-staging      Active   Xm  
# monitoring       Active   Xm

# 4c. cert-manager 狀態 (3 個 pods 都應該是 Running)
kubectl get pods -n cert-manager
# 預期結果：
# cert-manager-xxx            1/1   Running   0   Xm
# cert-manager-cainjector-xxx 1/1   Running   0   Xm
# cert-manager-webhook-xxx    1/1   Running   0   Xm

# 4d. nginx-ingress 狀態 (1 個 controller pod 應該是 Running)
kubectl get pods -n ingress-nginx
# 預期結果：
# ingress-nginx-controller-xxx   1/1   Running   0   Xm

# 4e. SSL 證書狀態 (應該看到 production-tls 和 staging-tls)
kubectl get certificates -A
# 預期結果：
# tcl-production   production-tls   True    production-tls   Xm    (初始為 False 是正常的，等待驗證)
# tcl-staging      staging-tls      True    staging-tls      Xm    (需要 LoadBalancer IP 就緒)

# 4f. DNS 解析檢查 (應該解析到靜態 IP)
dig $(terraform output -raw domain_name) +short
# 預期結果：34.95.126.115 (或你的靜態 IP)

# 4g. 靜態 IP 和 LoadBalancer 檢查
terraform output static_ip
kubectl get svc -n ingress-nginx
# 預期結果：
# nginx-ingress-controller LoadBalancer IP 應該從 <pending> 變為靜態 IP
# SSL 證書在 LoadBalancer 就緒後會自動變為 True 狀態

# 4h. 完整部署狀態檢查
kubectl get all -A | grep -E "(cert-manager|ingress-nginx)"
# 所有 pods 都應該是 Running 狀態
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
#### 常見部署問題
##### 問題：cert-manager CRDs 不存在
```bash
# 原因：kubernetes_manifest 在 cert-manager 完成安裝前執行
# 解決方案：分步驟部署
terraform apply -target="module.ssl[0].helm_release.cert_manager" -var="enable_k8s_resources=true"
terraform apply -var="enable_k8s_resources=true"
```
##### 問題：Secret Manager API 未啟用
```bash
# 解決方案：
gcloud services enable secretmanager.googleapis.com --project=PROJECT_ID
```

##### 問題：kubernetes provider 連接錯誤
```bash
# 解決方案：確保 kubectl 已配置
gcloud container clusters get-credentials $(terraform output -raw cluster_name) --region $(terraform output -raw region)
```
##### 問題：LoadBalancer External-IP 一直顯示 <pending>
```bash
# 原因：靜態IP類型錯誤 (Global vs Regional)
# 檢查當前IP類型：
gcloud compute addresses list --global
gcloud compute addresses list --regions=REGION

# 解決方案：將 Global 靜態IP 改為 Regional 靜態IP
# 在 modules/networking/main.tf 中修改：
# google_compute_global_address -> google_compute_address
# 並加入 region = var.region 參數
terraform apply -target=module.networking.google_compute_address.static_ip -auto-approve

# 重新配置 LoadBalancer Service 使用新IP
kubectl delete svc nginx-ingress-ingress-nginx-controller -n ingress-nginx
kubectl apply -f updated-loadbalancer-service.yaml
```

#### 一般故障排除
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

# SSL 證書問題排除
kubectl logs -n cert-manager deployment/cert-manager
kubectl describe clusterissuer letsencrypt-prod

# 檢查證書申請狀態（初始為 False 是正常的）
kubectl get certificates -A
kubectl describe certificate production-tls -n tcl-production

# LoadBalancer IP pending 問題
kubectl get svc -n ingress-nginx
# 等待 GCP 分配 LoadBalancer IP，SSL 證書會自動變為 Ready
```

#### DNS 配置問題
```bash
# 問題：DNS 記錄未生效
# 檢查 Cloudflare DNS 記錄
dig @8.8.8.8 $(terraform output -raw domain_name)
nslookup $(terraform output -raw domain_name)

# 檢查 DNS 傳播狀態
curl -s "https://dns.google/resolve?name=$(terraform output -raw domain_name)&type=A" | jq

# 問題：SSL 證書無效
# 檢查證書狀態（需要等待 LoadBalancer IP 分配完成）
curl -vI https://$(terraform output -raw domain_name)
openssl s_client -connect $(terraform output -raw domain_name):443
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
TON Cat Lottery 使用 **GKE Autopilot + Kustomize** 實現雙環境微服務部署。系統基於 Terraform 基礎設施，透過 K8s 編排容器化應用，並提供完整的 HTTPS 自動化管理。

**主要特色：**
- **雙環境隔離**：Production/Staging 完全分離的命名空間 (tcl-production/tcl-staging)
- **Kustomize 配置管理**：base + overlays 實現環境差異化配置  
- **Docker 映像自動化**：commit hash 標籤策略 + Artifact Registry 整合
- **零停機部署**：健康檢查 + 滾動更新，所有配置經生產環境驗證
- **安全生產就緒**：非 root 容器、資源限制、HTTPS 自動續期
- **實用問題解決**：包含權限配置、映像拉取等常見部署問題的解決方案

### 架構
```
Internet → Cloudflare DNS → Static IP → nginx-ingress → Services
                                                      └── frontend-service (React dApp)
                                                      
                                     K8s Cluster (內部)
                                                      └── backend-deployment (Go Daemon, 無 Service)
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
│   ├── kustomization.yaml          # 基礎 Kustomize 配置
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

#### 部署架構說明
K8s 應用部署建立在 Terraform 基礎設施之上，使用 **Kustomize** 進行環境差異化配置管理：

```
Terraform 基礎設施 → K8s 應用部署 → 雙環境驗證
├── GKE 集群                ├── Docker 映像構建       ├── Production 環境
├── nginx-ingress          ├── Kustomize 配置       ├── Staging 環境  
├── cert-manager           ├── 健康檢查配置         └── SSL 證書驗證
└── 靜態 IP + DNS          └── 滾動部署
```

**重要概念：**
- 你**必須先**完成 Terraform 基礎設施部署
- 雙環境使用相同的 Docker 映像，但不同的配置和資源分配
- 所有部署都通過 `kubectl apply -k` 完成 Kustomize 配置合成
- **映像標籤同步**是部署成功的關鍵，使用 commit hash 策略

**部署策略說明：**
- **Base 配置** → 前端/後端通用 Deployment 和 Service 定義
- **Overlays 差異化** → Production (高資源+多副本) vs Staging (低資源+單副本)  
- **權限修復** → GKE 節點需要 Artifact Registry 讀取權限 (常見問題)

#### 階段式部署流程
##### 0. 前置檢查：確保基礎設施就緒
```bash
# 確認 Terraform 基礎設施已部署
terraform -chdir=terraform output cluster_name
terraform -chdir=terraform output static_ip

# 切換到正確的 GCP 帳戶（重要！避免權限問題）
gcloud config set account liu.chaowei.dev@gmail.com
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1

# 驗證集群連接
kubectl get namespaces | grep -E "(tcl-production|tcl-staging)"
```

##### 1. 權限配置（關鍵步驟：解決映像拉取問題）
```bash
# 修復 GKE 節點 Artifact Registry 權限（必要！）
PROJECT_NUMBER=$(gcloud projects describe ton-cat-lottery-dev-3 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding ton-cat-lottery-dev-3 \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"

# Docker 認證配置
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 驗證權限設定
gcloud artifacts repositories list --location=asia-east1
```

##### 2. 階段式 Docker 映像構建
```bash
# 確保 Docker Desktop 運行中
docker info > /dev/null || (echo "請啟動 Docker Desktop" && exit 1)

# 獲取 commit hash 作為映像標籤（版本追蹤策略）
COMMIT_SHA=$(git rev-parse --short HEAD)
PROJECT_ID=$(gcloud config get-value project)
echo "使用映像標籤: $COMMIT_SHA"

# 階段 2a: 構建前端映像（多階段建構：開發→生產）
docker buildx build --platform linux/amd64 \
  -f docker/Dockerfile.frontend --target production \
  -t asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/frontend:$COMMIT_SHA --push .

# 階段 2b: 構建後端映像  
docker buildx build --platform linux/amd64 \
  -f docker/Dockerfile.backend \
  -t asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/backend:$COMMIT_SHA --push .

# 階段 2c: 驗證映像推送成功
gcloud artifacts docker images list asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo --include-tags
echo "✅ 映像構建完成，標籤: $COMMIT_SHA"
```

#### 3. 階段式 K8s 部署（使用 Kustomize，解決映像標籤同步問題）
```bash
# 階段 3a: 更新 kustomization 檔案中的映像標籤（關鍵步驟）
COMMIT_SHA=$(git rev-parse --short HEAD)
cd k8s/overlays/staging
sed -i '' "s/newTag: .*/newTag: $COMMIT_SHA/" kustomization.yaml
cd ../production  
sed -i '' "s/newTag: .*/newTag: $COMMIT_SHA/" kustomization.yaml
cd ../../..
echo "✅ Kustomization 檔案已更新"

# 階段 3b: 部署 Staging 環境（測試先行）
kubectl apply -k k8s/overlays/staging
echo "Staging 環境部署中..."

# 階段 3c: 等待 Staging 就緒後部署 Production
sleep 30
kubectl get pods -n tcl-staging
kubectl apply -k k8s/overlays/production
echo "Production 環境部署中..."

# 階段 3d: 處理常見映像拉取問題（如果遇到）
# 如果看到 ImagePullBackOff 或 ErrImagePull，執行以下修復：
PROJECT_ID=$(gcloud config get-value project)
kubectl patch deployment frontend -n tcl-staging -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"frontend\",\"image\":\"asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/frontend:$COMMIT_SHA\"}]}}}}"
kubectl patch deployment backend -n tcl-staging -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"backend\",\"image\":\"asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/backend:$COMMIT_SHA\"}]}}}}"
kubectl patch deployment frontend -n tcl-production -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"frontend\",\"image\":\"asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/frontend:$COMMIT_SHA\"}]}}}}"
kubectl patch deployment backend -n tcl-production -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"backend\",\"image\":\"asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/backend:$COMMIT_SHA\"}]}}}}"
```

##### 4. Ingress 和 SSL 配置（網路入口設定）
```bash
# 移除有問題的 admission webhook（如果遇到建立 ingress 失敗）
kubectl delete validatingwebhookconfiguration nginx-ingress-ingress-nginx-admission 2>/dev/null || true

# 部署雙域名 ingress 配置
kubectl apply -f k8s/ingress/ingress.yaml

# 檢查 ingress 狀態
kubectl get ingress -A
echo "✅ Ingress 配置完成"
```

##### 5. 雙環境部署驗證
```bash
# 5a. 檢查 Pod 狀態（所有 pods 應該是 Running 和 Ready 1/1）
echo "=== Staging 環境狀態 ==="
kubectl get pods -n tcl-staging -o wide
echo ""
echo "=== Production 環境狀態 ==="  
kubectl get pods -n tcl-production -o wide

# 5b. 健康檢查驗證（確認應用正常運行）
echo "=== 健康檢查測試 ==="
kubectl exec deployment/frontend -n tcl-staging -- curl -s http://localhost/health
kubectl exec deployment/backend -n tcl-staging -- curl -s http://localhost:8080/health

# 5c. 服務端點檢查（確認 Service 正確路由到 Pods）
echo "=== 服務端點檢查 ==="
kubectl get endpoints -n tcl-staging
kubectl get endpoints -n tcl-production

# 5d. SSL 證書和 Ingress 狀態
echo "=== SSL 和 Ingress 狀態 ==="
kubectl get ingress -A
kubectl get certificates -A
# 注意：SSL 證書初始為 False 是正常的，需等待 LoadBalancer IP 分配

# 5e. 完整部署狀態總覽
echo "=== 部署狀態總覽 ==="
echo "Staging (1 frontend + 1 backend replicas):"
kubectl get deployment -n tcl-staging
echo ""
echo "Production (3 frontend + 2 backend replicas):"  
kubectl get deployment -n tcl-production
echo ""
echo "✅ K8s 雙環境部署完成"
echo "📝 訪問地址："
echo "  Production: https://cat-lottery.chaowei-liu.com"
echo "  Staging: https://dev.cat-lottery.chaowei-liu.com"
echo "⏳ SSL 證書將在 LoadBalancer IP 分配完成後自動就緒"
```

##### 6. 問題排查（常見情況）
```bash
# 映像拉取失敗
kubectl describe pod POD_NAME -n tcl-staging | grep -A 5 "Events:"

# 健康檢查失敗  
kubectl logs deployment/frontend -n tcl-staging --tail=20
kubectl logs deployment/backend -n tcl-staging --tail=20

# LoadBalancer 外部 IP pending
kubectl describe svc nginx-ingress-ingress-nginx-controller -n ingress-nginx

# SSL 證書未就緒
kubectl describe certificate -A
kubectl get pods -n cert-manager
```

### 常用管理指令
```bash
# 查看雙環境狀態
kubectl get all -n tcl-production
kubectl get all -n tcl-staging

# 查看 Pod 和日誌
kubectl get pods -n tcl-production -o wide
kubectl logs deployment/frontend -n tcl-production --tail=50
kubectl logs deployment/backend -n tcl-production --tail=50

# 重啟部署（映像更新後）
kubectl rollout restart deployment/frontend -n tcl-production
kubectl rollout restart deployment/backend -n tcl-production

# 更新映像標籤
COMMIT_SHA=$(git rev-parse --short HEAD)
kubectl patch deployment frontend -n tcl-production -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"frontend\",\"image\":\"asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/frontend:$COMMIT_SHA\"}]}}}}"

# 檢查配置
kubectl get configmap backend-config -n tcl-production -o yaml
kubectl describe certificate production-tls -n tcl-production

# 擴縮容（生產環境）
kubectl scale deployment frontend --replicas=5 -n tcl-production
kubectl scale deployment backend --replicas=3 -n tcl-production
```

---

## 部署完成 ✅
雙環境 K8s 應用已成功部署至 GKE 集群：
- **Production**: `cat-lottery.chaowei-liu.com` (3 frontend + 2 backend replicas)
- **Staging**: `dev.cat-lottery.chaowei-liu.com` (1 frontend + 1 backend replica)
- **SSL 證書**: 由 cert-manager + Let's Encrypt 自動管理
- **負載均衡**: nginx-ingress + GCP LoadBalancer 靜態 IP

---
## GitHub Action (CI/CD)
### 簡介
TON Cat Lottery 使用 GitHub Actions 實現完全自動化的 CI/CD 流程，採用 Workload Identity Federation (OIDC) 進行安全的 GCP 認證。系統支援程式碼品質檢查、自動化測試、Docker 映像建構與推送，以及 GKE 應用程式部署。

**主要特色：**
- **三層品質關卡**：代碼品質檢查、全端測試驗證、安全掃描
- **安全的 OIDC 認證**：無需儲存 Service Account Key，使用短期 token
- **智能環境管理**：Staging/Production 雙環境，PR 自動部署，智能清理
- **自動化部署流程**：Docker 映像建構 + GKE 滾動更新 + 健康檢查
- **完整的回滾機制**：自動回滾策略 + 手動回滾支援
- **監控和報告**：部署狀態追蹤 + 詳細的執行報告

### 架構
```
GitHub Repository → CI Pipeline (品質關卡) → CD Pipeline (部署驗證)
                    ├── 🔍 代碼品質檢查        ├── 🔐 OIDC 認證  
                    ├── 🧪 三層測試驗證        ├── 🏗️ 映像建構推送
                    │   ├── Contract Tests    ├── 🚀 GKE 滾動部署
                    │   ├── Frontend Tests    ├── 🔍 健康檢查驗證
                    │   └── Backend Tests     └── 🌐 外部可達性測試
                    ├── 🔒 安全掃描
                    └── 🐳 Docker 建構驗證
```

**環境管理策略：**
```
雙環境架構：
├── Production (cat-lottery.chaowei-liu.com)
│   ├── Trigger: main 分支推送
│   ├── 前置檢查：安全檢查 + 業務時間驗證
│   ├── 部署策略：滾動更新 + 多副本 (3 frontend + 2 backend)
│   └── 驗證：完整健康檢查 + 外部可達性測試
├── Staging (dev.cat-lottery.chaowei-liu.com)  
│   ├── Trigger: PR 到 main 分支
│   ├── 部署策略：快速部署 + 單副本測試
│   ├── 智能清理：PR 關閉時自動縮放為 0
│   └── 驗證：基本健康檢查
└── 智能清理機制：
    ├── PR 關閉觸發環境清理
    ├── 定期清理舊容器映像（保留最新 5 個）
    └── 資源優化和成本控制
```

### 檔案結構
```
.github/workflows/
├── ci.yml                           # CI 工作流程：品質關卡與測試
└── cd.yml                           # CD 工作流程：部署與驗證

項目根目錄/
├── setup-gcp-oidc.sh               # OIDC 設定自動化腳本
├── scripts/
│   └── verify-cicd.sh               # CI/CD 配置驗證腳本
└── .github/
    └── secrets/                     # GitHub Secrets 配置
        ├── GCP_WIF_PROVIDER          # Workload Identity Provider
        ├── GCP_SERVICE_ACCOUNT       # Service Account Email  
        └── PROJECT_ID                # GCP 專案 ID
```

### 快速啟動

#### 前置條件檢查
```bash
# 1. 驗證 CI/CD 基礎設施配置
./scripts/verify-cicd.sh

# 2. 確認 Terraform 基礎設施已部署
cd terraform && terraform output cluster_name
cd terraform && terraform output static_ip

# 3. 確認 GKE 集群和命名空間就緒
kubectl get namespaces | grep -E "(tcl-production|tcl-staging)"
```

#### 階段式配置流程

##### 階段 1：OIDC 認證配置
```bash
# 1a. 執行自動化 OIDC 設定腳本
./setup-gcp-oidc.sh

# 1b. 記錄腳本輸出的 GitHub Secrets 資訊
# 將在下個步驟中用到：
# - GCP_WIF_PROVIDER
# - GCP_SERVICE_ACCOUNT  
# - PROJECT_ID

# 1c. 驗證 OIDC 設定成功
gcloud iam workload-identity-pools list --location=global | grep github-pool
gcloud iam service-accounts list | grep gha-deploy
```

##### 階段 2：GitHub Secrets 配置
```bash
# 2a. 使用 GitHub CLI 設定 Secrets (推薦)
gh secret set GCP_WIF_PROVIDER --body "your-wif-provider-from-script-output"
gh secret set GCP_SERVICE_ACCOUNT --body "gha-deploy@ton-cat-lottery-dev-3.iam.gserviceaccount.com"
gh secret set PROJECT_ID --body "ton-cat-lottery-dev-3"

# 2b. 或通過 GitHub 網頁界面設定
# 前往: Repository Settings → Secrets and variables → Actions
# 添加上述三個 secrets

# 2c. 驗證 Secrets 設定
gh secret list
```

##### 階段 3：GitHub 環境配置 (可選，增強安全性)
```bash
# 3a. 建立 Production 環境保護
# 前往 GitHub Repository Settings → Environments
# 建立 "production" 環境，設定：
# - Required reviewers: 1+ 審核者
# - Deployment branches: main 分支限制
# - Environment secrets: 可選的環境特定配置

# 3b. 建立 Staging 環境  
# 建立 "staging" 環境，無特殊限制
```

##### 階段 4：測試 CI/CD 流程
```bash
# 4a. 測試 CI 流程
# 推送代碼到 feature 分支觸發 CI
git checkout -b feature/test-cicd
echo "# Test CI/CD" >> test-file.md
git add . && git commit -m "test: trigger CI pipeline"
git push origin feature/test-cicd

# 4b. 監控 CI 執行
gh run list --limit 5
gh run watch  # 實時監控最新執行

# 4c. 測試 CD 流程（建立 PR 觸發 Staging 部署）
gh pr create --title "Test CI/CD Pipeline" --body "Testing automated deployment"

# 4d. 測試 Production 部署
# 合併 PR 到 main 分支將觸發 Production 部署
gh pr merge --merge
```

### 配置

#### 核心組件設定
- **OIDC 身份驗證**：執行 `setup-gcp-oidc.sh` 建立 GitHub 與 GCP 信任關係，配置 Workload Identity Pool
- **GitHub Secrets**：設定 `GCP_WIF_PROVIDER`、`GCP_SERVICE_ACCOUNT`、`PROJECT_ID`
- **環境保護**：使用 GitHub Environment 保護生產部署（可選但建議）
- **分支策略**：main 分支保護，PR 審核機制


#### 管理指令

##### 工作流程監控
```bash
# 查看工作流程狀態
gh workflow list

# 查看執行記錄
gh run list --limit 10

# 實時監控最新執行
gh run watch

# 查看特定執行的詳細日誌
gh run view <RUN_ID> --log

# 下載執行日誌
gh run download <RUN_ID>
```

##### 手動觸發部署
```bash
# 手動觸發 CD 工作流程（部署到 staging）
gh workflow run cd.yml -f environment=staging

# 手動觸發 CD 工作流程（部署到 production）
gh workflow run cd.yml -f environment=production

# 強制部署（跳過安全檢查）
gh workflow run cd.yml -f environment=production -f force_deploy=true

# 重新執行失敗的工作流程
gh run rerun <RUN_ID>
```

##### 流程控制
```bash
# 取消執行中的工作流程
gh run cancel <RUN_ID>

# 檢查工作流程執行狀態
gh run list --status=in_progress

# 查看失敗的工作流程
gh run list --status=failure --limit 5
```

##### CI/CD 狀態檢查
```bash
# 驗證 CI/CD 配置
./scripts/verify-cicd.sh

# 檢查 GitHub Secrets
gh secret list

# 檢查部署狀態
kubectl get pods -n tcl-production -o wide
kubectl get pods -n tcl-staging -o wide

# 檢查映像版本
kubectl describe deployment frontend -n tcl-production | grep Image
kubectl describe deployment backend -n tcl-production | grep Image
```

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

#### CI 流程問題

##### 問題：CI 品質檢查失敗
```bash
# 檢查代碼品質問題
# 1. 智能合約編譯失敗
cd contracts && npm ci && npm run build

# 2. 前端 linting 或 type-check 失敗
cd frontend && npm ci && npm run lint && npm run type-check

# 3. 後端代碼格式問題
cd backend && go fmt ./... && go vet ./...

# 4. Docker 建構失敗
docker build -f docker/Dockerfile.frontend .
docker build -f docker/Dockerfile.backend .
```

##### 問題：測試套件失敗
```bash
# 分別測試各組件
# 智能合約測試
cd contracts && npm test

# 前端測試
cd frontend && npm test -- --watchAll=false

# 後端測試
cd backend && go test -v ./...

# 檢查測試環境配置
./scripts/verify-cicd.sh
```

##### 問題：安全掃描警告
```bash
# 檢查 npm 安全漏洞
cd contracts && npm audit --audit-level=moderate
cd frontend && npm audit --audit-level=moderate

# 更新有漏洞的依賴
cd contracts && npm audit fix
cd frontend && npm audit fix

# Go 安全檢查（如果可用）
go list -json -deps ./... | grep "Module"
```

#### CD 流程問題

##### 問題：OIDC 認證失敗
```bash
# 1. 檢查 Workload Identity 設定
gcloud iam workload-identity-pools describe github-pool --location=global

# 2. 檢查服務帳戶設定
gcloud iam service-accounts describe gha-deploy@ton-cat-lottery-dev-3.iam.gserviceaccount.com

# 3. 檢查 GitHub Secrets
gh secret list
# 確認包含：GCP_WIF_PROVIDER, GCP_SERVICE_ACCOUNT, PROJECT_ID

# 4. 重新執行 OIDC 設定
./setup-gcp-oidc.sh

# 5. 檢查服務帳戶權限
gcloud projects get-iam-policy ton-cat-lottery-dev-3 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:gha-deploy@ton-cat-lottery-dev-3.iam.gserviceaccount.com"
```

##### 問題：映像建構與推送失敗
```bash
# 1. 檢查 Artifact Registry 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 2. 驗證 Artifact Registry 存在
gcloud artifacts repositories list --location=asia-east1

# 3. 檢查現有映像
gcloud artifacts docker images list asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo

# 4. 手動測試映像建構
COMMIT_SHA=$(git rev-parse --short HEAD)
docker buildx build \
  --platform linux/amd64 \
  -f docker/Dockerfile.frontend \
  -t asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/frontend:$COMMIT_SHA \
  .

# 5. 檢查網路連接和權限
curl -I https://asia-east1-docker.pkg.dev
```

##### 問題：GKE 部署失敗
```bash
# 1. 檢查集群連接
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1
kubectl cluster-info

# 2. 檢查命名空間
kubectl get namespaces | grep -E "(tcl-production|tcl-staging)"

# 3. 檢查當前部署狀態
kubectl get deployments -n tcl-production
kubectl get pods -n tcl-production -o wide

# 4. 檢查 Kustomize 配置
kubectl apply -k k8s/overlays/production --dry-run=client
kubectl apply -k k8s/overlays/staging --dry-run=client

# 5. 檢查資源配額和限制
kubectl describe namespace tcl-production
kubectl get resourcequota -n tcl-production

# 6. 檢查 Ingress 和服務
kubectl get ingress -A
kubectl get services -n tcl-production
```

##### 問題：健康檢查失敗
```bash
# 1. 檢查 Pod 狀態
kubectl get pods -n tcl-production -o wide
kubectl describe pod <POD_NAME> -n tcl-production

# 2. 檢查應用日誌
kubectl logs -f deployment/frontend -n tcl-production
kubectl logs -f deployment/backend -n tcl-production

# 3. 測試容器內健康檢查
kubectl exec deployment/frontend -n tcl-production -- curl -f http://localhost/health
kubectl exec deployment/backend -n tcl-production -- ps aux

# 4. 檢查服務端點
kubectl get endpoints -n tcl-production
kubectl describe service frontend-service -n tcl-production
```

##### 問題：外部可達性測試失敗
```bash
# 1. 檢查 DNS 解析
nslookup cat-lottery.chaowei-liu.com
nslookup dev.cat-lottery.chaowei-liu.com

# 2. 檢查 SSL 證書狀態
kubectl get certificates -A
kubectl describe certificate production-tls -n tcl-production

# 3. 檢查 LoadBalancer 狀態
kubectl get services -n ingress-nginx
kubectl describe service nginx-ingress-ingress-nginx-controller -n ingress-nginx

# 4. 手動測試連通性
curl -I -k https://cat-lottery.chaowei-liu.com --connect-timeout 10
curl -I -k https://dev.cat-lottery.chaowei-liu.com --connect-timeout 10

# 5. 檢查靜態 IP 配置
cd terraform && terraform output static_ip
```

#### 環境清理問題
```bash
# 問題：智能清理機制未執行
# 1. 手動縮放 staging 環境
kubectl scale deployment --all --replicas=0 -n tcl-staging

# 2. 手動清理舊映像
for service in frontend backend; do
  gcloud artifacts docker images list \
    asia-east1-docker.pkg.dev/ton-cat-lottery-dev-3/tcl-repo/$service \
    --sort-by=~createTime \
    --format="value(name)" \
    --limit=999 | tail -n +6 | while read image; do
    if [ -n "$image" ]; then
      gcloud artifacts docker images delete "$image" --quiet
    fi
  done
done

# 3. 檢查資源使用
kubectl top pods -n tcl-staging
kubectl get resourcequota -A
```

#### GitHub Secrets 問題

##### 問題：Secrets 缺失或配置錯誤
```bash
# 1. 檢查必要的 GitHub Secrets
gh secret list
# 應包含：GCP_WIF_PROVIDER, GCP_SERVICE_ACCOUNT, PROJECT_ID

# 2. 獲取正確的 Secrets 值
# 從 OIDC 設定腳本輸出中獲取，或手動查詢：
PROJECT_NUMBER=$(gcloud projects describe ton-cat-lottery-dev-3 --format="value(projectNumber)")
echo "GCP_WIF_PROVIDER: projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "GCP_SERVICE_ACCOUNT: gha-deploy@ton-cat-lottery-dev-3.iam.gserviceaccount.com"
echo "PROJECT_ID: ton-cat-lottery-dev-3"

# 3. 使用 GitHub CLI 設定 secrets（推薦）
gh secret set GCP_WIF_PROVIDER --body "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
gh secret set GCP_SERVICE_ACCOUNT --body "gha-deploy@ton-cat-lottery-dev-3.iam.gserviceaccount.com"
gh secret set PROJECT_ID --body "ton-cat-lottery-dev-3"

# 4. 或通過 GitHub 網頁界面設定
# Repository Settings → Secrets and variables → Actions → New repository secret
```

##### 問題：Secrets 權限問題
```bash
# 檢查當前用戶是否有 repository admin 權限
gh api repos/:owner/:repo/collaborators/$(gh api user | jq -r .login)/permission

# 檢查 organization secrets 設定（如果適用）
gh secret list --org YOUR_ORG
```

#### 常見 CI/CD 工作流程錯誤總結
```bash
# 快速診斷腳本
echo "🔍 執行完整 CI/CD 診斷..."
./scripts/verify-cicd.sh

echo "📋 檢查最近的工作流程執行..."
gh run list --status=failure --limit 3

echo "🔐 驗證 GitHub Secrets..."
gh secret list

echo "☁️ 檢查 GCP 連接..."
gcloud auth list
gcloud config get-value project

echo "🎯 檢查部署狀態..."
kubectl get pods -n tcl-production --no-headers | awk '{print $1, $3}'
kubectl get pods -n tcl-staging --no-headers | awk '{print $1, $3}'

echo "✅ 診斷完成！查看上述輸出以識別問題"
```

---

## CI/CD 階段完成總結 ✅

### 🎉 已實作功能
- **✅ 三層品質關卡**：代碼品質、全端測試、安全掃描  
- **✅ OIDC 安全認證**：無金鑰認證，自動化腳本配置
- **✅ 雙環境部署**：Production/Staging 智能路由
- **✅ 智能清理機制**：PR 關閉自動清理，舊映像清理
- **✅ 完整監控驗證**：健康檢查、外部可達性測試
- **✅ 詳細故障排除**：涵蓋所有常見問題和解決方案

### 🛠️ 關鍵檔案
```
TON Cat Lottery CI/CD 基礎設施：
├── .github/workflows/ci.yml         # CI 品質關卡流程
├── .github/workflows/cd.yml         # CD 部署驗證流程  
├── setup-gcp-oidc.sh               # OIDC 自動配置腳本
├── scripts/verify-cicd.sh           # CI/CD 配置驗證工具
└── docs/DevOpsREADME.md             # 完整操作文檔
```

### 🚀 下一步操作
1. **執行 OIDC 設定**：`./setup-gcp-oidc.sh`
2. **配置 GitHub Secrets**：依照腳本輸出設定
3. **測試 CI/CD 流程**：推送代碼觸發工作流程
4. **監控部署狀態**：`gh run watch` 實時監控

### 🔗 相關連結  
- 📊 **GitHub Actions**: [Repository Actions](https://github.com/用戶名/ton-cat-lottery/actions)
- ☁️ **GCP Console**: [Kubernetes Workloads](https://console.cloud.google.com/kubernetes/workload)
- 🐳 **Container Registry**: [Artifact Registry](https://console.cloud.google.com/artifacts)
- 🌐 **Production**: https://cat-lottery.chaowei-liu.com
- 🧪 **Staging**: https://dev.cat-lottery.chaowei-liu.com

---
## Monitoring (Prometheus + Grafana)

### 簡介

採用 **Prometheus + Grafana + AlertManager** 監控技術棧，為 TON Cat Lottery 提供完整的系統監控、可視化 Dashboard 和告警功能。

**技術特色：**
- **Prometheus**：指標收集和存儲
- **Grafana**：可視化 Dashboard
- **AlertManager**：告警管理和通知
- **展示 DevOps 監控技能**：完整監控體系實現

---

### 架構

```
Grafana Dashboard ← PromQL → Prometheus Server
                                    ↑
                            Metrics Collection
                    ┌─────────────┬─────────────┐
                    │             │             │
              kube-state-   node-exporter   App Metrics
               metrics                      (/metrics)
                    │             │             │
               K8s Cluster     Node Info    Frontend/Backend

AlertManager ← Alert Rules ← Prometheus
     ↓
Email/Slack Notifications
```

---

### 檔案結構

```bash
k8s/monitoring/
├── prometheus/
│   ├── deployment.yaml     # Prometheus server
│   ├── configmap.yaml      # 配置和採集規則
│   └── service.yaml        # Service
├── grafana/
│   ├── deployment.yaml     # Grafana server
│   ├── service.yaml        # Service
│   └── dashboards/         # Dashboard JSON 檔案
├── alertmanager/
│   ├── deployment.yaml     # AlertManager
│   └── configmap.yaml      # 告警規則
└── exporters/
    ├── kube-state-metrics.yaml
    └── node-exporter.yaml
```

---

### 快速開始/設定

#### 1. 基礎設施確認（必要前置步驟）

```bash
# 先確認 Terraform 基礎設施已部署（參考 Terraform 章節）
cd terraform/
terraform output monitoring_namespace
terraform output prometheus_storage_class

# 取得集群憑證
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1
```

#### 2. 部署監控服務

```bash
# 部署 Prometheus + Grafana + AlertManager
kubectl apply -f k8s/monitoring/

# 檢查狀態
kubectl get pods -n monitoring
```

#### 3. 訪問 Grafana

```bash
# Port-forward 進行本地訪問
kubectl port-forward -n monitoring svc/grafana 3000:3000

# 瀏覽器打開 http://localhost:3000
# 默認帳號: admin/admin
```

#### 4. 配置 Dashboard

1. **導入 Dashboard**：Grafana → Import → 上傳 JSON 檔案
2. **配置數據源**：Prometheus URL: `http://prometheus:9090`
3. **驗證指標**：確認圖表顯示數據

#### 5. 應用指標整合

**Backend 指標暴露：**
```go
// main.go
import "github.com/prometheus/client_golang/prometheus/promhttp"

func main() {
    http.Handle("/metrics", promhttp.Handler())
    http.ListenAndServe(":8080", nil)
}
```

**自定義業務指標：**
```go
var lotteryParticipants = prometheus.NewGauge(prometheus.GaugeOpts{
    Name: "ton_lottery_participants_total",
    Help: "Current lottery participants",
})

func init() {
    prometheus.MustRegister(lotteryParticipants)
}
```

---

### 故障排除

#### Terraform 基礎設施問題
```bash
# 檢查 monitoring namespace 是否建立
kubectl get namespace monitoring

# 檢查 PVC 是否正常
kubectl get pvc -n monitoring
kubectl describe pvc prometheus-storage -n monitoring

# 檢查 RBAC 權限
kubectl auth can-i get nodes --as=system:serviceaccount:monitoring:prometheus
kubectl get clusterrolebinding | grep monitoring
```

#### Prometheus 指標採集問題
```bash
# 檢查 targets 狀態
kubectl port-forward svc/prometheus 9090:9090
# 訪問 localhost:9090/targets

# 驗證應用 /metrics 端點
kubectl exec -it <pod> -- curl localhost:8080/metrics
```

#### Grafana Dashboard 無數據
```bash
# 測試 Prometheus 連接
# Grafana → Configuration → Data Sources → Test

# 手動查詢指標
# localhost:9090/graph → 輸入 PromQL 查詢
```

#### AlertManager 告警不發送
```bash
# 檢查告警規則
kubectl port-forward svc/prometheus 9090:9090
# 訪問 localhost:9090/alerts

# 檢查 AlertManager 狀態
kubectl logs -n monitoring deployment/alertmanager
```

---
