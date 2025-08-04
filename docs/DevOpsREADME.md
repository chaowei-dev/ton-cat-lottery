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


## GitHub Action (CI/CD)

### CI

### CD