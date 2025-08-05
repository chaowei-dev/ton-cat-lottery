# DevOps 相關說明

## 目錄
- [Docker](#docker)
- [GCP-設定](#gcp-設定)
- [Terraform](#terraform)
- [k8s GKE](#k8s-gke)
- [GitHub Action (CI/CD)](#github-action-cicd)

---
## Docker
### 架構
- **backend**: Go 語言後端服務 (抽獎邏輯)
- **frontend**: React + Vite 前端應用
- **frontend-dev**: 前端開發服務 (可選)
- **monitor**: Prometheus 監控服務 (可選)

### 簡介
TON Cat Lottery 使用 Docker 容器化部署，提供一致的開發和生產環境。專案採用多服務架構，使用 Docker Compose 統一管理所有服務的啟動、網路和環境配置。

**主要特色：**
- 多環境支援：生產、開發、監控環境
- 熱重載：前端開發模式支援即時編輯
- 網路隔離：所有服務運行在獨立的 Docker 網路中
- 健康檢查：自動監控服務狀態
- 環境變數管理：安全的配置管理

### 檔案結構
```
ton-cat-lottery/
├── docker/
│   ├── Dockerfile.backend      # Go 後端服務容器配置
│   └── Dockerfile.frontend     # React 前端應用容器配置
├── docker-compose.yml          # 服務編排配置
├── .env.example               # 環境變數範例
└── .env                       # 實際環境變數 (需自行建立)
```



### 快速啟動
**環境設定**
在啟動services前，需要先設定環境變數：

```bash
# 1. 複製環境變數範例檔案
cp .env.example .env

# 2. 編輯 .env 檔案，填入必要配置
vim .env  # 或使用其他編輯器
```

**必填環境變數**
- `LOTTERY_CONTRACT_ADDRESS`: 抽獎合約地址
- `NFT_CONTRACT_ADDRESS`: NFT 合約地址  
- `WALLET_PRIVATE_KEY`: 後端服務錢包私鑰

**指令**
```bash
# 生產環境
# 啟動後端和前端服務
docker-compose up --build -d

# 開發環境
# 啟動開發服務 (前端熱重載)
docker-compose --profile development up --build -d

# 包含監控
# 啟動所有服務包括 Prometheus 監控
docker-compose --profile monitoring up --build -d
```

**服務訪問**
- **前端應用**: http://localhost:3000
- **前端開發**: http://localhost:5173 (開發模式)
- **後端服務**: http://localhost:8080

### 常用指令
```bash
# 查看服務狀態
docker-compose ps

# 查看服務日誌
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 進入容器
docker-compose exec backend sh
docker-compose exec frontend sh

# 重啟服務
docker-compose restart backend
docker-compose restart frontend

# 停止和清理
docker-compose down
docker-compose down -v  # 刪除數據卷
docker-compose down --rmi all  # 刪除鏡像

# 重新構建
docker-compose build --no-cache backend
docker-compose up --build -d
```

### 故障排除

#### 系統資源與埠檢查
```bash
# 檢查埠是否被佔用
lsof -i :3000
lsof -i :8080
lsof -i :5173

# 終止佔用進程
sudo kill -9 <PID>

# 查看資源使用情況
docker stats
```

#### 應用健康與可存取性檢查
```bash
# 手動健康檢查
curl -f http://localhost:3000/health
curl -f http://localhost:5173/
```

#### 容器狀態與日誌排查
```bash
# 檢查容器狀態
docker-compose ps -a

# 查看容器啟動錯誤日誌
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

#### 環境變數與設定檢查
```bash
# 檢查 .env 檔案內容
cat .env

# 檢查容器內環境變數
docker-compose exec backend env | grep -E "(TON|LOTTERY|NFT|WALLET)"

# 驗證環境變數是否正確載入
docker-compose config
```

#### 容器間網路檢查
```bash
# 測試容器之間的連線
docker-compose exec backend ping frontend
docker-compose exec frontend ping backend
```

#### 清理與重建
```bash
# 清理未使用的 Docker 資源
docker system prune -a

# 重置整個環境
docker-compose down -v --remove-orphans
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

### 快速啟動
#### 階段 1：GCP 帳號與專案設定
```bash
# 1. 註冊 GCP 帳號並建立專案
# - 前往 https://console.cloud.google.com/
# - 建立新專案，例如：ton-cat-lottery-dev-2
# - 設定計費帳戶與預算告警 ($50/月開發限制)
```

#### 階段 2：本地開發工具安裝
```bash
# 1. 安裝 Google Cloud SDK
brew install --cask google-cloud-cli

# 2. 安裝 Terraform
brew install terraform

# 3. 安裝 kubectl
gcloud components install kubectl

# 4. 驗證安裝
gcloud version
terraform version
kubectl version --client
```

#### 階段 3：GCP 認證與專案設定
```bash
# 1. 登入 GCP
gcloud auth login

# 2. 檢查可用專案
gcloud projects list

# 3. 設定預設專案
gcloud config set project YOUR_PROJECT_ID

# 4. 驗證當前設定
gcloud config list
```

#### 階段 4：Terraform 服務帳戶設定
```bash
# 1. 建立服務帳戶 (透過 GCP Console)
# - 前往 IAM & Admin > Service Accounts
# - 建立服務帳戶：terraform-service-account
# - 分配以下權限：
#   * Project Editor
#   * Kubernetes Engine Admin
#   * Service Account Admin

# 2. 下載服務帳戶金鑰
# - 在服務帳戶詳情頁面建立新金鑰 (JSON 格式)
# - 將金鑰檔案重新命名為 terraform-service-account-key.json
# - 放置於專案根目錄

# 3. 啟用服務帳戶認證
gcloud auth activate-service-account --key-file=terraform-service-account-key.json

# 4. 驗證服務帳戶權限
gcloud auth list
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### 常用指令
#### GCP 專案管理
```bash
# 檢查當前專案設定
gcloud config list

# 切換專案
gcloud config set project NEW_PROJECT_ID

# 檢查專案資訊
gcloud projects describe PROJECT_ID

# 列出可用區域
gcloud compute regions list

# 檢查 API 啟用狀態
gcloud services list --enabled
```

#### 認證管理
```bash
# 檢查認證狀態
gcloud auth list

# 重新登入 (使用者帳戶)
gcloud auth login

# 使用服務帳戶認證
gcloud auth activate-service-account --key-file=PATH_TO_KEY_FILE

# 撤銷認證
gcloud auth revoke ACCOUNT_EMAIL

# 清除所有認證
gcloud auth revoke --all
```

#### 服務帳戶管理
```bash
# 列出服務帳戶
gcloud iam service-accounts list

# 檢查服務帳戶詳情
gcloud iam service-accounts describe SERVICE_ACCOUNT_EMAIL

# 列出服務帳戶權限
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:SERVICE_ACCOUNT_EMAIL"

# 建立新的服務帳戶金鑰
gcloud iam service-accounts keys create KEY_FILE_NAME \
  --iam-account=SERVICE_ACCOUNT_EMAIL
```

#### API 服務管理
```bash
# 啟用必要的 API 服務
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 檢查 API 服務狀態
gcloud services list --enabled --filter="name:container.googleapis.com"

# 停用 API 服務 (謹慎使用)
gcloud services disable SERVICE_NAME
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

# 問題：API 服務未啟用
# 檢查必要 API 狀態
gcloud services list --enabled --project=PROJECT_ID

# 批次啟用所有必要 API
gcloud services enable \
  container.googleapis.com \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  servicenetworking.googleapis.com
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

**架構概覽：**
```
Internet → Cloudflare DNS → Static IP → Ingress Controller → Services (ClusterIP)
```

### 檔案結構
```
terraform/
├── main.tf                      # 主要 GCP 基礎設施資源
├── providers.tf                 # Provider 配置 (GCP, K8s, Helm, Cloudflare)
├── variables.tf                 # 變數定義
├── outputs.tf                   # 輸出值 (IP, 集群資訊等)
├── cert-manager.tf              # SSL 憑證管理與 Ingress Controller
├── dns.tf                       # Cloudflare DNS 記錄與安全設定
├── terraform.tfvars.example     # 環境變數範例
├── terraform.tfvars             # 實際變數值 (不納入版控)
├── terraform.tfstate            # Terraform 狀態檔案 (本地)
└── terraform.tfstate.backup     # 狀態檔案備份
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

**必填變數：**
```hcl
# GCP 配置
project_id = "your-gcp-project-id"
region     = "asia-east1"

# DNS & SSL 配置
domain_name          = "lottery.yourdomain.com"
cloudflare_email     = "your-email@example.com"
cloudflare_api_token = "your-cloudflare-api-token"
cloudflare_zone_id   = "your-cloudflare-zone-id"
letsencrypt_email    = "your-email@example.com"
```

#### 階段 2：初始化 Terraform
```bash
# 1. 初始化 Terraform
terraform init

# 2. 驗證配置檔案
terraform validate

# 3. 檢查部署計畫
terraform plan
```

#### 階段 3：分階段部署
```bash
# 1. 部署 GCP 基礎設施
terraform apply -target=google_project_service.enabled_apis
terraform apply -target=google_compute_network.vpc
terraform apply -target=google_compute_subnetwork.subnet
terraform apply -target=google_container_cluster.primary

# 2. 驗證 GKE 集群
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1
kubectl get nodes

# 3. 部署 SSL 和 Ingress
terraform apply -target=helm_release.cert_manager
terraform apply -target=helm_release.nginx_ingress
terraform apply -target=kubernetes_manifest.letsencrypt_staging
terraform apply -target=kubernetes_manifest.letsencrypt_prod

# 4. 配置 DNS 記錄
terraform apply -target=cloudflare_record.app_dns
terraform apply -target=cloudflare_record.www_dns

# 5. 完整部署
terraform apply
```

#### 階段 4：部署驗證
```bash
# 1. 檢查所有資源狀態
terraform show

# 2. 驗證 Kubernetes 集群
kubectl get nodes
kubectl get namespaces

# 3. 檢查 cert-manager
kubectl get pods -n cert-manager

# 4. 檢查 ingress controller
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx

# 5. 驗證 DNS 解析
nslookup your-domain.com

# 6. 測試 HTTPS 訪問
curl -I https://your-domain.com
```

### 常用指令
#### 基本 Terraform 操作
```bash
# 初始化工作目錄
terraform init

# 檢查配置語法
terraform validate

# 格式化配置檔案
terraform fmt

# 生成部署計畫
terraform plan

# 執行部署
terraform apply

# 確認部署 (跳過互動確認)
terraform apply -auto-approve

# 銷毀所有資源
terraform destroy
```

#### 針對性資源管理
```bash
# 針對特定資源進行操作
terraform plan -target=google_container_cluster.primary
terraform apply -target=google_container_cluster.primary

# 刷新狀態檔案
terraform refresh

# 匯入現有資源
terraform import google_compute_network.vpc projects/PROJECT_ID/global/networks/NETWORK_NAME

# 顯示資源清單
terraform state list

# 顯示特定資源狀態
terraform state show google_container_cluster.primary
```

#### 變數與輸出管理
```bash
# 檢查變數值
terraform console
> var.project_id
> var.domain_name

# 顯示所有輸出值
terraform output

# 顯示特定輸出值
terraform output cluster_endpoint
terraform output static_ip_address

# 以 JSON 格式顯示輸出
terraform output -json
```

#### 狀態檔案管理
```bash
# 備份狀態檔案
cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)

# 移動資源到新的狀態位置
terraform state mv google_compute_network.old_vpc google_compute_network.new_vpc

# 從狀態中移除資源 (不銷毀實際資源)
terraform state rm google_compute_firewall.example

# 解鎖狀態檔案 (如遇到鎖定問題)
terraform force-unlock LOCK_ID
```

#### Kubernetes 整合操作
```bash
# 取得 GKE 憑證
gcloud container clusters get-credentials $(terraform output -raw cluster_name) \
  --region $(terraform output -raw region)

# 配置 Docker 認證
$(terraform output -raw docker_auth_command)

# 檢查集群狀態
kubectl cluster-info
kubectl get nodes -o wide

# 檢查 cert-manager 狀態
kubectl get clusterissuers
kubectl get certificates --all-namespaces

# 檢查 ingress controller
kubectl get svc -n ingress-nginx
kubectl get ingress --all-namespaces
```

### 故障排除
#### 部署失敗排查
```bash
# 問題：terraform init 失敗
# 解決方案：檢查 provider 版本與網路連接
terraform version
terraform providers

# 清除 .terraform 目錄重新初始化
rm -rf .terraform .terraform.lock.hcl
terraform init

# 問題：API 權限不足
# 檢查服務帳戶權限
gcloud projects get-iam-policy $(terraform output -raw project_id) \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:YOUR_SERVICE_ACCOUNT"

# 檢查必要 API 是否啟用
gcloud services list --enabled --project=$(terraform output -raw project_id)
```

#### 資源衝突解決
```bash
# 問題：資源已存在錯誤
# 解決方案：匯入現有資源或修改資源名稱

# 匯入現有 VPC 網路
terraform import google_compute_network.vpc projects/PROJECT_ID/global/networks/NETWORK_NAME

# 匯入現有子網路
terraform import google_compute_subnetwork.subnet projects/PROJECT_ID/regions/REGION/subnetworks/SUBNET_NAME

# 問題：IP 地址衝突
# 檢查現有 IP 地址
gcloud compute addresses list

# 釋放未使用的 IP 地址
gcloud compute addresses delete ADDRESS_NAME --region=REGION
```

#### GKE 集群問題
```bash
# 問題：無法連接到 GKE 集群
# 重新取得憑證
gcloud container clusters get-credentials $(terraform output -raw cluster_name) \
  --region $(terraform output -raw region) --project $(terraform output -raw project_id)

# 檢查集群狀態
gcloud container clusters describe $(terraform output -raw cluster_name) \
  --region $(terraform output -raw region)

# 問題：節點無法啟動
# 檢查節點池狀態
kubectl get nodes -o wide
kubectl describe nodes

# 檢查系統 Pod
kubectl get pods --all-namespaces
kubectl get events --sort-by=.metadata.creationTimestamp
```

#### SSL 憑證問題
```bash
# 問題：Let's Encrypt 憑證申請失敗
# 檢查 cert-manager 日誌
kubectl logs -n cert-manager deployment/cert-manager

# 檢查 ClusterIssuer 狀態
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

**服務架構：**
```
Internet → Cloudflare DNS → Static IP → nginx-ingress → Services
                                                      ├── frontend-service (React dApp)
                                                      └── backend-service (Go API)
```

### 檔案結構
```
k8s/
├── config/                          # 配置管理
│   ├── namespace.yaml              # 命名空間定義
│   ├── backend-config.yaml         # 後端環境變數 ConfigMap
│   └── backend-secrets.yaml        # 後端敏感資訊 Secret
├── backend/                        # 後端服務部署
│   ├── deployment.yaml             # 後端 Deployment 配置
│   └── service.yaml                # 後端 Service (ClusterIP)
├── frontend/                       # 前端服務部署
│   ├── deployment.yaml             # 前端 Deployment 配置
│   └── service.yaml                # 前端 Service (ClusterIP)
└── ingress/                        # 外部訪問
    └── ingress.yaml                # Ingress 路由與 SSL 配置
```

### 快速啟動
#### 階段 1：準備工作
```bash
# 1. 確保 GKE 集群已通過 Terraform 部署
kubectl get nodes

# 2. 配置 Docker 認證 (推送映像用)
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 3. 設定 kubectl 上下文
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1

# 4. 驗證 cert-manager 和 ingress-nginx 已安裝
kubectl get pods -n cert-manager
kubectl get pods -n ingress-nginx
```

#### 階段 2：建構和推送容器映像
```bash
# 1. 設定多架構建構支援
docker buildx create --use --name multiarch

# 2. 建構並推送後端映像
docker buildx build --platform linux/amd64 \
  -f docker/Dockerfile.backend \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:$(git rev-parse --short HEAD) \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest \
  --push .

# 3. 建構並推送前端映像
docker buildx build --platform linux/amd64 \
  -f docker/Dockerfile.frontend --target production \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:$(git rev-parse --short HEAD) \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:latest \
  --push .

# 4. 驗證映像推送成功
docker manifest inspect asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest
docker manifest inspect asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:latest
```

#### 階段 3：部署應用到 Kubernetes
```bash
# 1. 創建命名空間
kubectl apply -f k8s/config/namespace.yaml

# 2. 部署配置 (ConfigMap 和 Secret)
kubectl apply -f k8s/config/

# 3. 部署後端服務
kubectl apply -f k8s/backend/

# 4. 部署前端服務
kubectl apply -f k8s/frontend/

# 5. 部署 Ingress (外部訪問)
kubectl apply -f k8s/ingress/

# 6. 檢查部署狀態
kubectl get all -n ton-cat-lottery
```

#### 階段 4：驗證部署
```bash
# 1. 檢查所有 Pod 狀態
kubectl get pods -n ton-cat-lottery

# 2. 檢查服務狀態
kubectl get svc -n ton-cat-lottery

# 3. 檢查 Ingress 和 SSL 憑證
kubectl get ingress -n ton-cat-lottery
kubectl get certificate -n ton-cat-lottery

# 4. 檢查應用日誌
kubectl logs -n ton-cat-lottery deployment/backend
kubectl logs -n ton-cat-lottery deployment/frontend

# 5. 測試內部服務連接
kubectl exec -n ton-cat-lottery deployment/frontend -- curl http://backend-service/health

# 6. 測試外部 HTTPS 訪問
curl -I https://your-domain.com
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
```

#### 服務和網路管理
```bash
# 查看服務詳情
kubectl describe svc backend-service -n ton-cat-lottery
kubectl describe svc frontend-service -n ton-cat-lottery

# 查看 Ingress 詳情
kubectl describe ingress ton-cat-lottery-ingress -n ton-cat-lottery

# 查看端點 (Endpoints)
kubectl get endpoints -n ton-cat-lottery

# 測試服務連接
kubectl exec -it deployment/frontend -n ton-cat-lottery -- curl http://backend-service

# Port forwarding (本地測試)
kubectl port-forward deployment/backend 8080:8080 -n ton-cat-lottery
kubectl port-forward deployment/frontend 3000:80 -n ton-cat-lottery
```

#### 配置管理
```bash
# 查看 ConfigMap
kubectl get configmap -n ton-cat-lottery
kubectl describe configmap backend-config -n ton-cat-lottery

# 查看 Secret
kubectl get secret -n ton-cat-lottery
kubectl describe secret backend-secrets -n ton-cat-lottery

# 更新 ConfigMap
kubectl create configmap backend-config \
  --from-literal=ton_network=testnet \
  --from-literal=auto_draw=true \
  --dry-run=client -o yaml | kubectl apply -f -

# 重新載入配置 (重啟 Pod)
kubectl rollout restart deployment/backend -n ton-cat-lottery
```

#### 自動擴縮容 (HPA)
```bash
# 創建 HPA
kubectl autoscale deployment backend --cpu-percent=70 --min=2 --max=10 -n ton-cat-lottery
kubectl autoscale deployment frontend --cpu-percent=70 --min=2 --max=10 -n ton-cat-lottery

# 查看 HPA 狀態
kubectl get hpa -n ton-cat-lottery
kubectl describe hpa backend -n ton-cat-lottery

# 查看資源使用情況
kubectl top nodes
kubectl top pods -n ton-cat-lottery

# 刪除 HPA
kubectl delete hpa backend -n ton-cat-lottery
```

#### SSL 憑證管理
```bash
# 查看憑證狀態
kubectl get certificate -n ton-cat-lottery
kubectl describe certificate ton-cat-lottery-tls -n ton-cat-lottery

# 查看 ClusterIssuer
kubectl get clusterissuer
kubectl describe clusterissuer letsencrypt-prod

# 查看憑證申請狀態
kubectl get certificaterequests -n ton-cat-lottery
kubectl describe certificaterequests -n ton-cat-lottery

# 手動觸發憑證續期
kubectl delete certificate ton-cat-lottery-tls -n ton-cat-lottery
kubectl apply -f k8s/ingress/ingress.yaml
```

#### 容器映像更新
```bash
# 更新映像版本
kubectl set image deployment/backend \
  backend=asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:NEW_TAG \
  -n ton-cat-lottery

kubectl set image deployment/frontend \
  frontend=asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:NEW_TAG \
  -n ton-cat-lottery

# 回滾到上一版本
kubectl rollout undo deployment/backend -n ton-cat-lottery
kubectl rollout undo deployment/frontend -n ton-cat-lottery

# 回滾到特定版本
kubectl rollout undo deployment/backend --to-revision=2 -n ton-cat-lottery
```

### 故障排除
#### Pod 啟動問題
```bash
# 問題：Pod 無法正常啟動
# 檢查 Pod 狀態和事件
kubectl get pods -n ton-cat-lottery
kubectl describe pod POD_NAME -n ton-cat-lottery

# 檢查 Pod 日誌
kubectl logs POD_NAME -n ton-cat-lottery
kubectl logs POD_NAME -n ton-cat-lottery --previous

# 問題：映像拉取失敗
# 檢查映像地址和認證
kubectl describe pod POD_NAME -n ton-cat-lottery | grep -A 5 "Events:"

# 驗證映像存在
gcloud container images list --repository=asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery

# 檢查 GKE 節點的映像拉取權限
kubectl describe nodes
```

#### 服務連接問題
```bash
# 問題：服務無法訪問
# 檢查服務配置
kubectl get svc -n ton-cat-lottery
kubectl describe svc backend-service -n ton-cat-lottery

# 檢查端點配置
kubectl get endpoints backend-service -n ton-cat-lottery

# 測試內部連接
kubectl exec -it deployment/frontend -n ton-cat-lottery -- nslookup backend-service
kubectl exec -it deployment/frontend -n ton-cat-lottery -- curl -v http://backend-service

# 檢查網路策略
kubectl get networkpolicies -n ton-cat-lottery
```

#### Ingress 和 SSL 問題
```bash
# 問題：Ingress 無法訪問
# 檢查 Ingress 狀態
kubectl get ingress -n ton-cat-lottery
kubectl describe ingress ton-cat-lottery-ingress -n ton-cat-lottery

# 檢查 nginx-ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# 問題：SSL 憑證錯誤
# 檢查憑證狀態
kubectl get certificate -n ton-cat-lottery
kubectl describe certificate ton-cat-lottery-tls -n ton-cat-lottery

# 檢查 cert-manager 日誌
kubectl logs -n cert-manager deployment/cert-manager

# 檢查 DNS 解析
nslookup your-domain.com
dig your-domain.com

# 手動測試 SSL
curl -vI https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### 資源和效能問題
```bash
# 問題：資源不足或效能問題
# 檢查資源使用情況
kubectl top nodes
kubectl top pods -n ton-cat-lottery

# 檢查資源限制
kubectl describe pod POD_NAME -n ton-cat-lottery | grep -A 10 "Limits:"

# 檢查節點狀態
kubectl describe nodes

# 檢查事件
kubectl get events -n ton-cat-lottery --sort-by=.metadata.creationTimestamp

# 問題：HPA 不工作
# 檢查 metrics-server
kubectl get pods -n kube-system | grep metrics-server
kubectl logs -n kube-system deployment/metrics-server
```

#### 配置問題
```bash
# 問題：環境變數錯誤
# 檢查 ConfigMap 內容
kubectl get configmap backend-config -n ton-cat-lottery -o yaml

# 檢查 Pod 內的環境變數
kubectl exec -it deployment/backend -n ton-cat-lottery -- env | grep -E "(TON|LOTTERY|NFT)"

# 更新配置後重啟服務
kubectl rollout restart deployment/backend -n ton-cat-lottery

# 問題：Secret 無法讀取
# 檢查 Secret 配置
kubectl get secret backend-secrets -n ton-cat-lottery -o yaml

# 檢查 Pod 權限
kubectl describe pod POD_NAME -n ton-cat-lottery | grep -A 5 "Volumes:"
```

#### 清理和重建
```bash
# 重建特定服務
kubectl delete deployment backend -n ton-cat-lottery
kubectl apply -f k8s/backend/deployment.yaml

# 完全清理命名空間
kubectl delete namespace ton-cat-lottery

# 重新部署所有資源
kubectl apply -f k8s/config/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/

# 強制重建 Pod
kubectl delete pod -l app=backend -n ton-cat-lottery
kubectl delete pod -l app=frontend -n ton-cat-lottery

# 清理失敗的資源
kubectl get all -n ton-cat-lottery | grep -E "(Error|Failed|Pending)"
kubectl delete pod POD_NAME -n ton-cat-lottery --force --grace-period=0
```

#### 日誌和監控
```bash
# 查看詳細日誌
kubectl logs -f deployment/backend -n ton-cat-lottery --tail=100
kubectl logs -f deployment/frontend -n ton-cat-lottery --tail=100

# 查看多個 Pod 日誌
kubectl logs -f -l app=backend -n ton-cat-lottery

# 查看系統事件
kubectl get events -n ton-cat-lottery --watch

# 檢查集群整體狀態
kubectl cluster-info
kubectl get componentstatuses

# 檢查 GKE 特定功能
gcloud container clusters describe ton-cat-lottery-cluster --region asia-east1
```

---
## GitHub Action (CI/CD)
### 簡介

### 檔案結構

### 快速啟動

### 常用指令

### 故障排除