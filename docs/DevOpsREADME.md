# DevOps 相關說明

## Docker 

### 服務架構
- **backend**: Go 語言後端服務 (抽獎邏輯)
- **frontend**: React + Vite 前端應用
- **frontend-dev**: 前端開發服務 (可選)
- **monitor**: Prometheus 監控服務 (可選)

### 快速啟動

#### 生產環境
```bash
# 啟動後端和前端服務
docker-compose up --build -d
```

#### 開發環境
```bash
# 啟動開發服務 (前端熱重載)
docker-compose --profile development up --build -d
```

#### 包含監控
```bash
# 啟動所有服務包括 Prometheus 監控
docker-compose --profile monitoring up --build -d
```

### 服務訪問
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
```bash
# 檢查端口使用情況
lsof -i :3000
lsof -i :8080
lsof -i :5173

# 手動健康檢查
curl -f http://localhost:3000/health
curl -f http://localhost:5173/

# 清理未使用的 Docker 資源
docker system prune -a

# 查看資源使用情況
docker stats
```

## GCP 設定

### 架構
- **項目**: ton-cat-lottery-dev
- **區域**: asia-east1 (台灣)
- **服務**: GKE Autopilot、Artifact Registry、VPC 網路、靜態 IP

### 內容簡介
Google Cloud Platform 雲端基礎設施，使用 GKE Autopilot 叢集部署容器化應用，包含完整的網路設定和容器鏡像倉庫。

### 指令
```bash
# 驗證 GCP 認證
gcloud auth list
gcloud config list project

# 連接到 GKE 叢集
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1 --project ton-cat-lottery-dev-468008

# 查看叢集狀態
gcloud container clusters describe ton-cat-lottery-cluster --region asia-east1

# 推送容器鏡像到 Artifact Registry
docker tag image-name asia-east1-docker.pkg.dev/ton-cat-lottery-dev-468008/ton-cat-lottery/image-name
docker push asia-east1-docker.pkg.dev/ton-cat-lottery-dev-468008/ton-cat-lottery/image-name

# 查看 Artifact Registry 倉庫
gcloud artifacts repositories list
gcloud artifacts docker images list asia-east1-docker.pkg.dev/ton-cat-lottery-dev-468008/ton-cat-lottery
```

### 故障排除
```bash
# 檢查 GCP 權限
gcloud auth application-default login
gcloud projects get-iam-policy ton-cat-lottery-dev-468008

# 檢查網路連接
gcloud compute networks describe ton-cat-lottery-network
gcloud compute addresses list --regions=asia-east1

# 重新設定 kubectl context
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1
kubectl config current-context

# 查看服務帳號權限
gcloud iam service-accounts list
gcloud projects get-iam-policy ton-cat-lottery-dev-468008 --filter="bindings.members:serviceAccount:gke-ton-cat-lottery-cluster-sa@ton-cat-lottery-dev-468008.iam.gserviceaccount.com"
```

## Terraform

### 架構
- **提供者**: Google Cloud (hashicorp/google v5.45.2)
- **資源數**: 24 個 (GKE、VPC、防火牆、IAM、Artifact Registry)
- **狀態管理**: 本地 terraform.tfstate 檔案

### 內容簡介
基礎設施即代碼 (IaC) 工具，自動化管理 GCP 資源的生命週期，包含 GKE Autopilot 叢集、網路設定、服務帳號和權限管理。

### 檔案結構
> Terraform 配置採用模組化設計，將基礎設施定義分散到多個檔案中便於管理和維護。

- **`main.tf`**: 主要資源定義檔案
  - GKE Autopilot 叢集配置 (enable_autopilot = true)
  - VPC 網路和子網路設定 (10.0.0.0/24, pods: 10.1.0.0/16, services: 10.2.0.0/16)
  - 防火牆規則 (HTTP/HTTPS, SSH, 內部流量)
  - 靜態 IP 和 Artifact Registry 倉庫
  - 服務帳號和 IAM 角色綁定
  - Google Cloud APIs 啟用

- **`variables.tf`**: 輸入變數定義
  - 專案 ID、區域、叢集名稱等可配置參數
  - 網路 CIDR 範圍和節點規格設定
  - 預設值設定 (asia-east1, e2-standard-2)

- **`outputs.tf`**: 輸出值定義
  - 叢集連線資訊 (endpoint, CA certificate)
  - Docker 倉庫 URL 和 kubectl 連線指令
  - 網路和 IP 資源資訊

- **`versions.tf`**: 提供者版本約束
  - Terraform 版本要求 (>= 1.0)
  - Google 提供者版本約束 (~> 5.0)
  - 提供者配置 (專案、區域設定)

- **`terraform.tfvars`**: 實際配置值
  - 生產環境具體參數設定
  - 專案 ID: ton-cat-lottery-dev-468008
  - 叢集和網路命名約定

- **`terraform.tfvars.example`**: 配置範例檔案
  - 新環境部署的參考模板
  - 敏感資訊的佔位符說明

### 指令
```bash
# 初始化 Terraform
terraform init

# 檢查部署計畫
terraform plan

# 執行部署
terraform apply

# 查看部署狀態
terraform show
terraform output

# 查看特定輸出
terraform output cluster_name
terraform output static_ip_address
terraform output kubectl_connection_command

# 檢查資源變更
terraform plan -detailed-exitcode

# 銷毀所有資源 (謹慎使用)
terraform destroy
```

### 故障排除
```bash
# 驗證 Terraform 配置
terraform validate
terraform fmt

# 重新整理狀態
terraform refresh

# 匯入現有資源 (如果狀態不同步)
terraform import google_container_cluster.primary projects/ton-cat-lottery-dev-468008/locations/asia-east1/clusters/ton-cat-lottery-cluster

# 檢查 Terraform 版本
terraform version

# 除錯模式
export TF_LOG=DEBUG
terraform plan

# 解決狀態鎖定問題
terraform force-unlock LOCK_ID

# 檢查提供者版本
terraform providers
```


## GKE (k8s on GCP) 


## GitHub Action (CI/CD)

### CI

### CD