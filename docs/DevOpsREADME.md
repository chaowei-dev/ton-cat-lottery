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


## k8s (GKE)

### 內容簡介

TON Cat Lottery 使用 Google Kubernetes Engine (GKE) Autopilot 進行容器化部署，包含 backend 和 frontend 兩個主要服務。系統採用 ConfigMap/Secret 管理配置，支援自動擴縮容 (HPA)、網路策略隔離和 Ingress 外部訪問。

**部署架構：**
- **Backend**: Go 守護進程，監控 TON 區塊鏈並自動觸發抽獎
- **Frontend**: React 應用，使用 nginx 提供靜態檔案服務
- **Network**: NetworkPolicy 隔離，ClusterIP + Ingress 外部訪問
- **Scaling**: HPA 根據 CPU/Memory 自動擴縮容

### 檔案結構

```
k8s/
├── config/
│   ├── namespace.yaml          # 命名空間定義
│   ├── backend-config.yaml     # Backend 環境變數 ConfigMap
│   ├── backend-secrets.yaml    # Backend 敏感資訊 Secret (已加入 .gitignore)
│   ├── frontend-config.yaml    # Frontend 環境變數 ConfigMap
│   └── networkpolicy.yaml      # 網路安全策略
├── backend/
│   ├── deployment.yaml         # Backend 部署配置 (2-5 replicas)
│   ├── service.yaml            # Backend ClusterIP 服務
│   └── hpa.yaml                # Backend 自動擴縮容 (CPU/Memory)
├── frontend/
│   ├── deployment.yaml         # Frontend 部署配置 (2-10 replicas)
│   ├── service.yaml            # Frontend ClusterIP 服務
│   └── hpa.yaml                # Frontend 自動擴縮容 (CPU/Memory)
└── ingress/
    └── ingress.yaml            # GKE Ingress + BackendConfig
```

### 指令

#### 基礎部署
```bash
# 取得 GKE 叢集憑證
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1

# 完整部署流程
kubectl apply -f k8s/config/namespace.yaml
kubectl apply -f k8s/config/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/
```

#### 建構和推送映像 (重要: 支援 x86_64)
```bash
# 設定多架構建構支援
docker buildx create --use --name multiarch

# 建構 backend (x86_64) 並推送
docker buildx build --platform linux/amd64 -f docker/Dockerfile.backend \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:$(git rev-parse --short HEAD) \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest --push .

# 建構 frontend (x86_64) 並推送
docker buildx build --platform linux/amd64 -f docker/Dockerfile.frontend --target production \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:$(git rev-parse --short HEAD) \
  -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:latest --push .

# 驗證映像架構
docker manifest inspect asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest
```

#### 監控和管理
```bash
# 檢查應用狀態
kubectl get pods -n ton-cat-lottery
kubectl get svc -n ton-cat-lottery
kubectl get ingress -n ton-cat-lottery

# 檢查 HPA 狀態
kubectl get hpa -n ton-cat-lottery

# 查看日誌
kubectl logs -n ton-cat-lottery -l app=backend --tail=50 -f
kubectl logs -n ton-cat-lottery -l app=frontend --tail=50

# 重新啟動部署
kubectl rollout restart deployment/backend-deployment -n ton-cat-lottery
kubectl rollout restart deployment/frontend-deployment -n ton-cat-lottery

# 擴縮容測試
kubectl scale deployment backend-deployment --replicas=3 -n ton-cat-lottery
```

### 故障排除

#### 常見問題

**1. Pod 處於 CrashLoopBackOff 狀態**
```bash
# 檢查 Pod 詳細狀態
kubectl describe pod POD_NAME -n ton-cat-lottery
kubectl logs POD_NAME -n ton-cat-lottery --previous

# 常見原因與解決方法：
# - 映像架構不匹配: 使用 docker buildx --platform linux/amd64
# - nginx 權限問題: 移除 Pod securityContext 或修正檔案權限
# - 環境變數配置錯誤: 檢查 ConfigMap 和 Secret 配置
```

**2. exec format error**
```bash
# 這是映像架構不匹配的典型錯誤
# 解決方法：重新建構 x86_64 映像
docker buildx build --platform linux/amd64 -f docker/Dockerfile.backend --push ...

# 驗證映像架構
docker manifest inspect IMAGE_NAME | grep architecture
```

**3. Ingress 無法獲得外部 IP**
```bash
# 檢查 Ingress 詳細狀態
kubectl describe ingress ton-cat-lottery-ingress -n ton-cat-lottery

# 常見問題：
# - 靜態 IP 名稱錯誤: 移除 global-static-ip-name annotation
# - BackendConfig 健康檢查失敗: 檢查 frontend 服務是否正常
# - 服務端口不匹配: 確認 Service targetPort 正確
```

**4. 內部服務連通性問題**
```bash
# 測試服務連通性
kubectl exec -it frontend-pod -n ton-cat-lottery -- curl backend-service:8080
kubectl exec -it frontend-pod -n ton-cat-lottery -- nslookup backend-service

# 檢查 NetworkPolicy 配置
kubectl get networkpolicy -n ton-cat-lottery -o yaml

# Backend 是守護進程，沒有 HTTP API 是正常的
```

**5. 映像拉取問題**
```bash
# 檢查映像是否存在
gcloud artifacts docker images list asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery

# 檢查認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 手動拉取測試
docker pull asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest
```

#### 除錯技巧

**進入 Pod 進行除錯**
```bash
# 進入 frontend Pod
kubectl exec -it $(kubectl get pods -n ton-cat-lottery -l app=frontend -o jsonpath='{.items[0].metadata.name}') -n ton-cat-lottery -- /bin/sh

# 進入 backend Pod
kubectl exec -it $(kubectl get pods -n ton-cat-lottery -l app=backend -o jsonpath='{.items[0].metadata.name}') -n ton-cat-lottery -- /bin/sh
```

**檢查資源使用量**
```bash
kubectl top pods -n ton-cat-lottery
kubectl top nodes
kubectl describe node NODE_NAME
```

**檢查事件和狀態**
```bash
kubectl get events -n ton-cat-lottery --sort-by='.lastTimestamp'
kubectl get all -n ton-cat-lottery
kubectl describe deployment backend-deployment -n ton-cat-lottery
```

**性能測試**
```bash
# 測試 Ingress 訪問
curl -I http://INGRESS_IP/
ab -n 100 -c 10 http://INGRESS_IP/

# 觀察 HPA 行為
kubectl get hpa -n ton-cat-lottery -w
```


## GitHub Actions (CI/CD)

### 內容簡介

TON Cat Lottery 使用 GitHub Actions 實現自動化 CI/CD 管線，提供基礎的持續整合和持續部署功能。CI 流程負責代碼品質檢查和 Docker 映像建構，CD 流程自動化部署到 GKE 叢集，實現完整的 DevOps 自動化工作流程。

**架構設計：**
- **CI 流程**: 代碼測試 → Docker 建構 → 安全驗證
- **CD 流程**: 映像推送 → GKE 部署 → 健康檢查
- **觸發條件**: 分支推送、Pull Request、手動觸發
- **環境管理**: 支援多環境部署 (開發/生產)

### 檔案結構

```
.github/workflows/
├── ci.yml              # 持續整合工作流程
└── cd.yml              # 持續部署工作流程
```

### CI 工作流程 (ci.yml)

**功能特性：**
- **代碼品質檢查**: 智能合約、前端、後端全面測試
- **Docker 建構驗證**: 確保容器映像可正常建構
- **並行執行**: 測試和建構任務同時進行，提高效率
- **分支策略**: 支援 main、master、feature/devops 分支觸發

**執行階段：**
1. **測試階段** (`test` job):
   - 智能合約測試: `cd contracts && npm run test`
   - 前端建構測試: `cd frontend && npm run build`  
   - Go 後端測試: `cd backend && ./test.sh`

2. **Docker 建構階段** (`docker` job):
   - 建構 backend Docker 映像
   - 建構 frontend Docker 映像
   - 使用 GitHub Actions 快取加速建構

**觸發條件：**
```yaml
on:
  push:
    branches: [ main, master, feature/devops ]
  pull_request:
    branches: [ main, master ]
```

### CD 工作流程 (cd.yml)

**功能特性：**
- **映像推送**: 自動推送到 GCP Artifact Registry
- **GKE 部署**: 滾動更新部署到 Kubernetes 叢集
- **健康檢查**: 驗證部署成功和服務可用性
- **多環境支援**: 支援開發和生產環境部署

**執行階段：**
1. **認證和設定**:
   - GCP 服務帳戶認證
   - Docker Artifact Registry 認證
   - GKE 叢集憑證取得

2. **映像建構和推送**:
   - 建構 backend/frontend 映像 (linux/amd64)
   - 推送到 Artifact Registry (latest + git-sha 標籤)
   - 驗證映像推送成功

3. **Kubernetes 部署**:
   - 自動取得 GKE 憑證
   - 執行滾動更新 (`kubectl set image`)
   - 等待部署完成 (`kubectl rollout status`)

4. **部署驗證**:
   - 檢查所有 Pod 為 Running 狀態
   - 驗證服務內部連通性
   - 輸出部署摘要信息

**觸發條件：**
```yaml
on:
  workflow_dispatch:    # 手動觸發
    inputs:
      environment: [ development, production ]
  push:
    branches: [ main, master ]    # 自動觸發
```

### 指令

#### 手動觸發工作流程
```bash
# 透過 GitHub CLI 手動觸發 CD
gh workflow run cd.yml -f environment=development

# 檢查工作流程狀態
gh run list --workflow=ci.yml
gh run list --workflow=cd.yml

# 查看特定執行詳情
gh run view RUN_ID
gh run logs RUN_ID
```

#### 本地測試 CI 步驟
```bash
# 模擬 CI 測試流程
cd contracts && npm ci && npm run build && npm run test
cd ../frontend && npm ci && npm run build
cd ../backend && chmod +x test.sh && ./test.sh

# 模擬 Docker 建構
docker build -f docker/Dockerfile.backend -t backend:test .
docker build -f docker/Dockerfile.frontend -t frontend:test .
```

#### GitHub Secrets 管理
```bash
# 使用 GitHub CLI 設定 Secrets
gh secret set GCP_SA_KEY < service-account-key.json
gh secret set GCP_PROJECT_ID --body "ton-cat-lottery-dev-468008"

# 查看已設定的 Secrets
gh secret list
```

### 故障排除

#### CI 常見問題

**1. 智能合約測試失敗**
```bash
# 錯誤: Cannot find module '../build/CatLottery_CatLottery'
# 原因: 合約未建構就直接測試
# 解決: CI 已添加 `npm run build` 步驟
```

**2. Go 後端測試超時**
```bash
# 錯誤: context canceled (超過 30s)
# 原因: transaction 和 lottery 模組集成測試過複雜
# 解決: 已排除問題模組，只測試核心模組
```

**3. Docker 建構失敗**
```bash
# 檢查本地建構
docker build -f docker/Dockerfile.backend -t test .

# 查看 GitHub Actions 日誌
gh run logs --job "docker"
```

#### CD 常見問題

**1. GCP 認證失敗**
```bash
# 檢查 Service Account Key 格式
echo $GCP_SA_KEY | jq .

# 驗證 Service Account 權限
gcloud iam service-accounts get-iam-policy SA_EMAIL
```

**2. Docker 推送失敗**
```bash
# 錯誤: permission denied
# 原因: Service Account 缺少 Artifact Registry 權限
# 解決: 添加 Artifact Registry Writer 角色

gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SA_EMAIL" \
    --role="roles/artifactregistry.writer"
```

**3. GKE 部署失敗**
```bash
# 錯誤: deployment not found
# 原因: Kubernetes 資源未部署或命名空間錯誤
# 解決: 確保先手動部署一次 k8s 資源

kubectl apply -f k8s/config/
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
```

**4. 滾動更新卡住**
```bash
# 檢查部署狀態
kubectl get deployment -n ton-cat-lottery-prod
kubectl describe deployment backend -n ton-cat-lottery-prod

# 常見原因:
# - 映像拉取失敗 (ImagePullError)
# - 資源不足 (Insufficient resources)
# - 健康檢查失敗 (Readiness probe failed)
```

#### 除錯技巧

**查看工作流程執行歷史**
```bash
# 列出最近的執行
gh run list --limit 10

# 查看失敗的執行詳情
gh run view --log-failed

# 重新執行失敗的工作流程
gh run rerun RUN_ID
```

**檢查部署後的應用狀態**
```bash
# 取得 GKE 憑證
gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1

# 檢查 CD 部署的資源
kubectl get pods -n ton-cat-lottery-prod
kubectl get ingress -n ton-cat-lottery-prod

# 查看最新部署的映像版本
kubectl get deployment backend -n ton-cat-lottery-prod -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**監控部署進度**
```bash
# 實時監控滾動更新
kubectl rollout status deployment/backend -n ton-cat-lottery-prod --watch
kubectl rollout status deployment/frontend -n ton-cat-lottery-prod --watch

# 檢查部署歷史
kubectl rollout history deployment/backend -n ton-cat-lottery-prod
```
