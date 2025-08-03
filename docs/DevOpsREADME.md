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

## Terraform 基礎設施

### 概述
此目錄包含 TON Cat Lottery 專案的 Terraform 基礎設施即代碼配置，用於自動化部署 GCP 基礎設施。通過代碼管理基礎設施，實現版本控制和自動化部署。

### 📋 基礎設施組件

- **GKE Autopilot 叢集**: 自動管理的 Kubernetes 叢集
- **VPC 網路**: 自定義虛擬私有網路與子網路
- **IAM 服務帳戶**: GKE 和 Terraform 操作的服務帳戶
- **防火牆規則**: 網路安全配置
- **Container Registry**: Docker 映像儲存
- **GCS 儲存桶**: Terraform 狀態檔案儲存

### 已建立的文件結構
```
terraform/
├── .gitignore              # 保護敏感資訊
├── README.md               # 完整使用指南
├── providers.tf            # Provider 與後端配置
├── variables.tf            # 變數定義
├── terraform.tfvars.example # 配置範例
├── terraform.tfvars        # 實際配置檔案
├── main.tf                 # 主要基礎設施配置
└── outputs.tf              # 輸出值定義
```

### 🚀 快速開始

#### 前置條件

**設定 GCP 認證**:
```bash
gcloud auth login
gcloud config set project ton-cat-lottery-dev
gcloud auth application-default login
```

#### 部署步驟

1. **複製配置檔案**:
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **編輯配置變數**:
   ```bash
   # 編輯 terraform.tfvars 檔案，設定正確的專案 ID 和區域
   vim terraform.tfvars
   ```

3. **初始化 Terraform**:
   ```bash
   terraform init
   ```

4. **檢查執行計畫**:
   ```bash
   terraform plan
   ```

5. **套用基礎設施 (基礎設施層)**:
   ```bash
   terraform apply
   ```
  - 創建 GCP 雲端資源
  - 設定網路和安全規則
  - 準備 Kubernetes 叢集環境


6. **配置 kubectl (應用程式層)**:
   ```bash
   # 使用輸出的指令配置 kubectl
   gcloud container clusters get-credentials ton-cat-lottery-cluster \
     --location asia-east1 \
     --project ton-cat-lottery-dev
   ```
  - 部署你的應用程式容器
  - 配置服務和負載均衡
  - 管理應用程式生命週期

### 📝 重要注意事項

#### 狀態檔案管理

- **初次部署**: 使用本地狀態檔案
- **團隊協作**: 建議使用 GCS 後端儲存狀態檔案

啟用 GCS 後端:
1. 註解掉 `providers.tf` 中的 backend 區塊進行初次部署
2. 部署完成後，取消註解 backend 配置
3. 執行 `terraform init` 遷移狀態到 GCS

#### 成本控制

- **GKE Autopilot**: 按使用量計費，自動優化成本
- **開發環境**: 建議設定預算告警 ($50/月)
- **生產環境**: 根據實際需求調整資源配置

#### 安全考量

- **.gitignore**: 已配置忽略敏感檔案
- **IAM 權限**: 遵循最小權限原則
- **網路安全**: 配置適當的防火牆規則

### 🔧 常用指令

```bash
# 檢查基礎設施狀態
terraform show

# 查看輸出值
terraform output

# 更新基礎設施
terraform plan && terraform apply

# 銷毀基礎設施
terraform destroy

# 格式化代碼
terraform fmt

# 驗證配置
terraform validate

# 切換工作空間（環境）
terraform workspace new dev
terraform workspace select dev
terraform workspace list
```

### 📊 輸出資訊

部署完成後，Terraform 會輸出以下重要資訊：

- **叢集連接指令**: kubectl 配置指令
- **Container Registry URL**: Docker 映像推送地址  
- **服務帳戶**: 各種操作所需的服務帳戶信息
- **網路配置**: VPC 和子網路詳細資訊

### 🔄 與現有 K8s 配置整合

部署完成後，可以使用現有的 Kubernetes manifests:

```bash
# 部署應用程式
kubectl apply -f ../k8s/backend-deployment.yaml
kubectl apply -f ../k8s/frontend-deployment.yaml

# 檢查服務狀態
kubectl get pods
kubectl get services
```

### 🐛 故障排除

#### 常見問題

1. **API 未啟用錯誤**:
   ```bash
   gcloud services enable container.googleapis.com
   gcloud services enable compute.googleapis.com
   ```

2. **權限不足錯誤**:
   ```bash
   # 確保帳戶有足夠權限
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="user:your-email@gmail.com" \
     --role="roles/owner"
   ```

3. **配額不足錯誤**:
   - 檢查 GCP 配額限制
   - 申請增加配額或更換區域

#### 清理資源

⚠️ **注意**: 此操作會刪除所有基礎設施資源

```bash
terraform destroy
```

### 📚 進階配置

#### 多環境部署

建議為不同環境建立獨立的 Terraform 工作區：

```bash
# 建立工作區
terraform workspace new staging
terraform workspace new production

# 切換工作區
terraform workspace select development
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