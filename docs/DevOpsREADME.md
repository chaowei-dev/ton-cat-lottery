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

## GCP 

### 環境設置
```bash
# 設定認證
gcloud auth login

# 設定專案
gcloud config set project ton-cat-lottery-dev

# 安裝 kubectl
gcloud components install kubectl
```

### GKE 叢集管理

#### 建立 Autopilot GKE 叢集
```bash
# 建立 Autopilot GKE 叢集（自動管理，成本低）
gcloud container clusters create-auto ton-cat-lottery-cluster \
    --region=asia-east1 \
    --enable-autorepair \
    --enable-autoupgrade

# 取得叢集憑證（需等待 5-10 分鐘）
gcloud container clusters get-credentials ton-cat-lottery-cluster --region=asia-east1

# 驗證連接
kubectl cluster-info
```

#### 建構並推送 Docker 映像到 Google Container Registry
```bash
# 配置 Docker 認證
gcloud auth configure-docker

# 建構前端映像
docker buildx build --platform linux/amd64 --target production \
    -f docker/Dockerfile.frontend \
    -t gcr.io/ton-cat-lottery-dev/frontend:latest .

# 建構後端映像
docker buildx build --platform linux/amd64 \
    -f docker/Dockerfile.backend \
    -t gcr.io/ton-cat-lottery-dev/backend:latest .

# 推送映像到 GCR
docker push gcr.io/ton-cat-lottery-dev/frontend:latest
docker push gcr.io/ton-cat-lottery-dev/backend:latest
```

### 部署管理

#### 部署應用到 GKE
```bash
# 應用 Kubernetes 配置
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/services.yaml

# 建立 LoadBalancer Service 取得外部 IP
kubectl get service frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

#### 域名與 SSL 設定（Cloudflare）
```bash
# 獲取外部 IP
kubectl get service frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# 檢查域名解析
nslookup dev.yourdomain.com

# 測試域名訪問
curl -I https://dev.yourdomain.com
```

### 常用指令
```bash
# 查看 GCP 專案資訊
gcloud config list
gcloud projects list

# 查看 GKE 叢集
gcloud container clusters list
gcloud container clusters describe ton-cat-lottery-cluster --region=asia-east1

# 查看 Container Registry 中的映像
gcloud container images list --repository=gcr.io/ton-cat-lottery-dev

# 刪除映像
gcloud container images delete gcr.io/ton-cat-lottery-dev/frontend:latest

# 檢查 API 狀態
gcloud services list --enabled

# 叢集維護
gcloud container clusters resize ton-cat-lottery-cluster --num-nodes 1 --region=asia-east1
gcloud container clusters delete ton-cat-lottery-cluster --region=asia-east1
```

## k8s 

### 常用指令

```bash
# 檢查叢集狀態
kubectl get pods
kubectl get services
kubectl get deployments

# 查看 Pod 日誌
kubectl logs <pod-name>
kubectl logs -f <pod-name>  # 即時追蹤日誌

# 重新部署應用
kubectl rollout restart deployment/frontend-deployment

# 應用配置變更
kubectl apply -f k8s/frontend-deployment.yaml

# 建構並推送 Docker 映像
docker buildx build --platform linux/amd64 --target production -f docker/Dockerfile.frontend -t gcr.io/ton-cat-lottery-dev/frontend:latest .
docker push gcr.io/ton-cat-lottery-dev/frontend:latest

# 檢查叢集資訊
kubectl cluster-info
kubectl get nodes

# 進入 Pod 內部
kubectl exec -it <pod-name> -- sh

# Cloudflare 域名管理
kubectl get service frontend-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}'  # 獲取外部 IP
nslookup dev.yourdomain.com  # 檢查域名解析
curl -I https://dev.yourdomain.com  # 測試域名訪問
```

## Terraform 基礎設施即代碼 (Infrastructure as Code)

### 概述
Terraform 用於管理 GCP 基礎設施，確保環境一致性和可重複性。通過代碼管理基礎設施，實現版本控制和自動化部署。

### 目標架構
- **GKE Autopilot 集群**: 自動管理的 Kubernetes 集群
- **Container Registry**: Docker 映像倉庫
- **Load Balancer**: 外部流量入口
- **IAM 角色**: 服務帳戶和權限管理
- **Networking**: VPC、子網路和防火牆規則

### 待建立的文件結構
```
terraform/
├── main.tf              # 主要資源定義
├── variables.tf         # 變數定義
├── outputs.tf          # 輸出值
├── versions.tf         # Provider 版本
├── environments/
│   ├── dev/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── terraform.tfvars
│       └── backend.tf
└── modules/
    ├── gke/
    ├── networking/
    └── iam/
```

### 設置步驟

#### 1. 安裝 Terraform
```bash
# macOS
brew install terraform

# 驗證安裝
terraform version
```

#### 2. 設置 GCP 服務帳戶
```bash
# 創建服務帳戶
gcloud iam service-accounts create terraform-sa \
    --display-name="Terraform Service Account"

# 授予必要權限
gcloud projects add-iam-policy-binding ton-cat-lottery-dev \
    --member="serviceAccount:terraform-sa@ton-cat-lottery-dev.iam.gserviceaccount.com" \
    --role="roles/editor"

# 創建金鑰
gcloud iam service-accounts keys create terraform-key.json \
    --iam-account=terraform-sa@ton-cat-lottery-dev.iam.gserviceaccount.com

# 設置環境變數
export GOOGLE_APPLICATION_CREDENTIALS="./terraform-key.json"
```

#### 3. 初始化 Terraform
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 常用指令
```bash
# 初始化工作目錄
terraform init

# 檢查配置語法
terraform validate

# 預覽變更
terraform plan

# 應用變更
terraform apply

# 查看當前狀態
terraform show

# 銷毀資源
terraform destroy

# 格式化代碼
terraform fmt

# 切換工作空間（環境）
terraform workspace new dev
terraform workspace select dev
terraform workspace list
```

### 狀態管理
```bash
# 設置遠端狀態存儲（Google Cloud Storage）
terraform {
  backend "gcs" {
    bucket = "ton-cat-lottery-terraform-state"
    prefix = "dev/terraform.tfstate"
  }
}
```

## GitHub Actions CI/CD 自動化

### 概述
實現從代碼提交到生產部署的完全自動化流程，包括測試、建構、部署多個環境。

### CI/CD 流程設計

#### 1. 觸發條件
- **Pull Request**: 執行測試和建構驗證
- **Push to main**: 自動部署到 staging 環境
- **Release Tag**: 自動部署到 production 環境
- **手動觸發**: 支援手動部署任何分支到指定環境

#### 2. 工作流程階段
```
Code Push → Tests → Build → Security Scan → Deploy to Dev → Integration Tests → Deploy to Staging → Manual Approval → Deploy to Production
```

### 待建立的 GitHub Actions 工作流程

#### 1. 測試工作流程 (.github/workflows/test.yml)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  frontend-test:
    # React 應用測試
  backend-test:
    # Go 應用測試
  contract-test:
    # Smart Contract 測試
```

#### 2. 建構和部署工作流程 (.github/workflows/deploy.yml)
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
  release:
    types: [published]
jobs:
  build:
    # Docker 映像建構
  deploy-dev:
    # 部署到開發環境
  deploy-staging:
    # 部署到測試環境
  deploy-prod:
    # 部署到生產環境（需要手動批准）
```

#### 3. 基礎設施工作流程 (.github/workflows/infrastructure.yml)
```yaml
name: Infrastructure
on:
  push:
    paths: ['terraform/**']
jobs:
  terraform-plan:
    # Terraform 計劃檢查
  terraform-apply:
    # 應用基礎設施變更
```

### 環境管理策略

#### 多環境配置
- **Development**: 自動部署，用於開發測試
- **Staging**: 自動部署，用於集成測試
- **Production**: 手動批准部署，用於正式環境

#### 秘密管理
```bash
# GitHub Secrets 需要設置：
GCP_PROJECT_ID          # GCP 專案 ID
GCP_SA_KEY              # 服務帳戶金鑰
REGISTRY_URL            # Container Registry URL
KUBE_CONFIG             # Kubernetes 配置
CLOUDFLARE_API_TOKEN    # Cloudflare API Token
```

### 建立工作流程的步驟

#### 1. 設置 GitHub Secrets
```bash
# 在 GitHub Repository Settings > Secrets 中添加：
# - GCP_PROJECT_ID: ton-cat-lottery-dev
# - GCP_SA_KEY: (服務帳戶 JSON 內容)
# - 其他必要的秘密
```

#### 2. 創建工作流程文件
```bash
mkdir -p .github/workflows
# 創建各種工作流程 YAML 文件
```

#### 3. 設置分支保護規則
```bash
# 在 GitHub Settings > Branches 設置：
# - 要求 PR 審查
# - 要求狀態檢查通過
# - 限制推送到 main 分支
```

### 監控和通知
- **建構狀態**: GitHub Actions 狀態徽章
- **部署通知**: Slack/Discord 整合
- **錯誤警報**: 自動通知相關人員
- **性能監控**: 整合 Prometheus 監控

## Terraform + GitHub Actions 整合最佳實踐

### 1. 基礎設施即代碼原則
- 所有基礎設施變更都通過 Terraform
- 使用 Git 管理基礎設施版本
- 實施代碼審查流程

### 2. 安全性最佳實踐
- 使用最小權限原則
- 敏感資料使用 GitHub Secrets
- 定期輪換存取金鑰
- 實施資源標籤和成本控制

### 3. 部署策略
- 藍綠部署減少停機時間
- 金絲雀部署降低風險
- 自動回滾機制
- 健康檢查和監控

### 4. 成本控制
- 自動清理測試環境
- 資源使用監控和警報
- 定期檢查未使用資源
- 實施資源配額限制

## 實施計劃

### 階段 1: Terraform 基礎設施設置
1. 建立 Terraform 配置文件
2. 設置遠端狀態管理
3. 創建開發環境基礎設施
4. 驗證和測試

### 階段 2: GitHub Actions CI/CD
1. 設置基本測試工作流程
2. 實施建構和部署管道
3. 配置多環境部署
4. 整合安全掃描

### 階段 3: 整合和優化
1. 整合 Terraform 到 CI/CD
2. 實施監控和警報
3. 優化性能和成本
4. 文檔和培訓

### 後續維護
- 定期更新依賴項
- 監控資源使用和成本
- 檢查和改進安全配置
- 持續優化部署流程