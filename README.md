# TON Cat Lottery dApp — 貓咪 NFT 抽獎平台

> 一個基於 TON 區塊鏈的鏈上抽獎系統，參加者可支付少量 TON 參與抽獎，有機會贏得限量版貓咪 NFT。

> 前端使用 React + TonConnect，後端使用 Go 來實作自動抽獎機器人，整體部署採用容器（Docker）化，並透過 terraform 來自動編排 GCP 基礎設施部署和搭配 GitHub Action 完成 CI/CD。

---

## ✨ 專案亮點

- **全鏈上邏輯**：使用 Tact 撰寫智能合約，負責抽獎與 NFT 發送
- **後端自動化抽獎機器人**：Go 撰寫 RPC 調用邏輯，自動觸發中獎邏輯
- **前端與錢包互動**：React + TonConnect，與 TON 錢包整合參與抽獎
- **Docker 容器化**：後端、前端、節點、監控模組皆為獨立容器
- **微服務架構**：各個模組透過 k8s 來實作微服務化
- **完整 DevOps 管線**：Terraform、GitHub Actions CI/CD

---

## 🖼️ 系統架構圖
![ProjectArch](figures/ProjectArch.png)

---
## 🛠️ 開發工具
- 透過 ChatGPT 來瞭解 DevOps 所需的技術鍊
- 閱讀各個工具的文檔來瞭解詳細技術：
  - **區塊鍊**：https://www.geeksforgeeks.org/software-engineering/blockchain/
  - **Ton**：https://docs.ton.org/v3/documentation/ton-documentation
  - **Terraform**：https://developer.hashicorp.com/terraform/docs
  - **k8s**：https://kubernetes.io/docs/home/
  - **cert-manager**：https://cert-manager.io/docs/
  - **GitHub Action**：https://docs.github.com/en/actions/get-started/understand-github-actions
- 開發過程透過 **cursor** 和 **Claude Code** 來協助開發
- 開發流程：
  ![DevOpsArch](figures/DevOpsArch.png)



---

## 📦 專案目錄結構

```bash
ton-cat-lottery/
├── contracts/                # Tact 智能合約
│   ├── CatLottery.tact       # 主抽獎合約
│   ├── CatNFT.tact           # 貓咪 NFT 合約
│   ├── scripts/              # 部署與互動腳本
├── backend/                  # Go 抽獎機器人服務  
├── frontend/                 # React dApp
├── docker/                   # 前端/後端容器話設定
├── terraform/                # terraform 基礎設施部署設定
├── k8s/                      # 微服務設定
├── .github/workflows/        # CI/CD 配置
├── docker-compose.yml        # Docker 容器編排
└── README.md
```

---

## 🧠 核心功能模組

### 🎯 智能合約（CatLottery.tact）

[NFT 合約文檔](docs/NFTREADME.md)

[貓咪樂園抽獎故事](docs/NFTStory.md)


### 🧰 後端自動抽獎機器人（Go）

（尚未完成）
<!-- [後端文檔](docs/BackREADME.md) -->



### ⚙️ DevOps 架構細節

[DevOps文檔](docs/DevOpsREADME.md)

---

## 🛠️ 環境需求

```
- Node.js >= 22.18.0
- Go >= 1.24.5
- Docker & Docker Compose
- Tact CLI
```

---

## 🚀 智能合約部署

> 在運行應用之前，需要先部署智能合約到 TON 區塊鏈。

### 部署到測試網

```bash
# 進入合約目錄
cd contracts

# 安裝依賴
npm install

# 部署合約到測試網
npx blueprint run deployCatLottery --testnet --tonconnec
```

### 部署後設定

1. **記錄合約地址**: 部署完成後，將顯示的合約地址記錄下來
2. **更新環境變數**: 在 `.env` 檔案中設定合約地址
   ```bash
   LOTTERY_CONTRACT_ADDRESS=你的抽獎合約地址
   NFT_CONTRACT_ADDRESS=你的NFT合約地址
   ```

#### 部署到主網

```bash
# 部署到主網 (請確保錢包有足夠的 TON)
npx blueprint run deployCatLottery --mainnet --tonconnec
```

⚠️ **注意**: 主網部署需要真實的 TON 代幣作為 gas 費用。

---


## 📚 技術棧

| 類別     | 技術                           |
| -------- | ------------------------------ |
| 程式語言 | Typescript, Go, Node.js, React |
| 區塊鏈   | TON, Tact, TonConnect          |
| 後端     | Go, Node.js                    |
| 前端     | React                          |
| 部署     | Docker, GitHub Actions, k8s    |
| 基礎設施 | Terraform, GCP                 |

---

## 🏁 TODO Checklist - 功能導向模組拆解

> 本清單依照功能模組拆解為可執行任務，便於開發與進度追蹤。

---
### 智能合約模組（Tact）

> 定義好「抽獎怎麼運作」「怎麼發 NFT」「參與者怎麼加入」。

#### 設計合約和 NFT 相關的邏輯
- [x] 抽獎合約如何定義
- [ ] NFT 合約如何定義
- [ ] 檢查兩者的邏輯

#### 開發
##### 抽獎合約
- [x] 初始化 `CatLottery.tact` 合約結構（定義 join/drawWinner/sendNFT）
- [x] 設計儲存參加者資料的 Cell 結構（儲存地址列表）
- [x] 實作 `join()` 方法（收款 + 儲存參與者）

##### NFT 合約
- [ ] 實作 `drawWinner()` 方法（根據 block hash 隨機選取）
- [ ] 實作 `sendNFT(address)`：觸發 NFT 合約轉移
- [ ] 撰寫 NFT 合約（符合 TON NFT 規範，支援 metadata）
- [ ] 鑄造並部署預設的 NFT（貓咪圖像）

#### 測試
- [x] 撰寫**抽獎**測試腳本
- [ ] 撰寫 **NFT** 測試腳本

#### 部署
- [x] 部署抽獎合約到 TON testnet
- [ ] 部署 NFT 合約到 TON testnet

---
### 後端服務模組（Go）

> 精簡版後端，專注於核心抽獎功能，減少實作複雜度但保持專案完整性。

#### 設計模組
- [ ] todo

#### 撰寫邏輯代碼
- [ ] 基礎設施

  - [ ] 初始化 Go 專案與模組設定（go.mod, 目錄結構）
  - [ ] 基礎配置管理（環境變數、合約地址、私鑰）
  - [ ] 基礎日志記錄（可用標準 log 套件）

- [ ] 智能合約互動

  - [ ] 撰寫 TonCenter API 客戶端（基礎查詢功能）
  - [ ] 實作錢包管理與交易簽名
  - [ ] 核心抽獎功能：
    - [ ] `GetContractInfo()` - 查詢抽獎狀態
    - [ ] `SendDrawWinner()` - 執行抽獎
    - [ ] `SendStartNewRound()` - 開始新輪次
  - [ ] 基礎交易監控（檢查交易是否成功）

- [ ] 核心業務邏輯

  - [ ] 實作自動抽獎定時器（簡單 cron job 或 ticker）
  - [ ] 基礎抽獎流程控制（檢查條件 → 執行抽獎 → 記錄結果）
  - [ ] 簡單錯誤處理與重試機制

#### 測試
- [ ] 基礎測試

    - [ ] 撰寫核心功能單元測試
    - [ ] 基礎集成測試（抽獎流程測試）

- [ ] 實際測試
  - [ ] 鏈接到監控合約，並進行監控
  - [ ] 鏈接到抽獎合約，並進行抽獎
  - [ ] 鏈接到 NFT 合約，並進行 NFT 發送

#### 部署
- 本地端透過 docker
- 雲端透過 docker + k8s + GitHub Action

---
### 前端 dApp（React + TonConnect）

> 在智能合約初步穩定後，你可以建立 dApp 前端與錢包互動。

#### 設計客戶端界面和模組架構
- [x] 設計界面
- [x] 定義需要哪些 components

#### 開發
##### 基本功能

- [x] 建立 React 專案架構 (Vite + TypeScript + 基礎 CSS)
- [x] 整合 TonConnect SDK - 支援 Tonkeeper 錢包連接與斷開
- [x] 建立自己的 mainfest 用來做測試，透過 cloudflare pages 來部署
- [x] 顯示合約狀態 - 參與人數、當前輪次、抽獎是否活躍
  - [x] 使用模擬資料來顯示合約狀態
  - [x] 串接真實的合約資料
- [x] 實作參加抽獎功能 - 發送 `join()` 交易並支付參與費用
  - [x] 合約還沒部署完成，所以先使用空 payload 來測試
  - [x] 合約部署完成後，使用 "join" 消息
- [x] 顯示用戶錢包資訊 - 地址、TON 餘額
- [x] 基礎交易狀態提示 - 發送中、成功、失敗通知
- [x] 基礎錯誤處理 - 網路錯誤、餘額不足、抽獎已滿等
- [ ] 參與者列表顯示 - 當前輪次的參與者地址
- [ ] 顯示中獎歷史記錄 - 查詢歷史輪次的中獎者和 NFT

##### 進階功能

- [ ] 實作即時狀態更新 - 定期刷新合約狀態（每 30 秒）
- [ ] 顯示獎池資訊 - 當前合約餘額和預計獎金
- [ ] 基礎響應式設計 - 支援手機和桌面瀏覽

#### 測試
- [ ] 撰寫 unit test

#### 部署
- 本地端透過 docker
- 雲端透過 docker + k8s + GitHub Action

---
### DevOps / 雲端自動化部署

> 階段式 DevOps 實作流程：Docker + Kubernetes + GCP + Terraform + CI/CD + GitHub Actions

| 階段 | 內容                    | 技術                       | 目標       |
| ---- | ----------------------- | -------------------------- | ---------- |
|  1   | 基礎容器化              | Docker + Docker Compose    | 建立容器化設定檔 |
|  2   | GCP 帳號設定           | GCP Console + 手動設定      | 完成無法自動化的帳號層級設定 |
|  3   | 基礎設施、微服務部署與 HTTPS 配置 | Terraform + GKE + cert-manager + Cloudflare DNS + HTTPS | 完成基礎設施，包含 GCP + GKE + SSL |
|  4   | K8s 應用部署準備        | K8s + Artifact Registry | 手動驗證完整部署流程 |
|  5   | 自動化部署              | GitHub Actions + GCP + OIDC | 自動化驗證和部署到 GCP |

---
#### 階段 1：基礎容器化

**技術棧：Docker + Docker Compose**
**目標：建立容器化設定檔**

- [x] **1. 撰寫 Dockerfile：**
  - [x] 撰寫 `Dockerfile`（backend）
  - [x] 撰寫 `Dockerfile`（frontend）
  - [x] 撰寫 `docker-compose.yml` 整合後端 / 前端
  - [x] 撰寫 `.env` 檔案與 secret 管理

- [x] **2. 測試 Dockerfile**
  - [x] 本地 Docker 環境驗證與測試

- [x] **3. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for docker
  - [x] 整理內容到 `docs/DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 2：GCP 帳號設定

> 技術：GCP Console + 手動設定

**目標：完成無法自動化的帳號層級設定**

- [x] **1. GCP 帳號與計費設定**（無法自動化的部分）：
  - [x] 註冊 GCP 帳號（新用戶可獲得 $300 免費額度）
  - [x] 建立專案 `ton-cat-lottery-dev-2`
  - [x] 設定計費帳戶與預算告警（$50/月 開發限制）
  
- [x] **2. 本地開發工具安裝：**
  - [x] 安裝 Google Cloud SDK：`brew install --cask gcloud-cli`
  - [x] 安裝 Terraform：`brew install terraform`
  - [x] 安裝 kubectl：`gcloud components install kubectl`
  - [x] 設定認證：`gcloud auth login`
  - [x] 檢查專案列表：`gcloud projects list`
  - [x] 設定專案：`gcloud config set project {PROJECT_NAME}`
  
- [x] **3. Terraform 服務帳戶設定：**
  - [x] 建立 Terraform 服務帳戶
  - [x] 分配 Terraform 服務帳戶必要權限：
    - Project Editor
    - Kubernetes Engine Admin  
    - Service Account Admin
  - [x] 下載服務帳戶金鑰 JSON 檔案
  - [x] **驗證**：測試 `gcloud auth activate-service-account` 正常運作

- [x] **4. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for GCP
  - [x] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 3：基礎設施、微服務部署與 HTTPS 配置

>技術：Terraform + GKE + cert-manager + Cloudflare DNS + HTTPS

**目標：完成基礎設施，包含 GCP + GKE(部署客戶界面前端和守護進程後端) + SSL(cloudflare + cert-manager)**

前端架構：
```
Internet → Cloudflare DNS → Static IP → Ingress Controller → Services (ClusterIP)
```


- [x] **1. Terraform 基礎設施即代碼：**

  - [x] 建立 `terraform/` 目錄結構

  - [x] **GCP API 啟用 Checklist：**
      <details>
      <summary><strong>需要啟用的服務許可</strong></summary>

      1. **計算與容器服務**
          ```
          container.googleapis.com        # Kubernetes Engine API (GKE)
          compute.googleapis.com          # Compute Engine API (VPC, 防火牆, IP)
          ```
      2. **容器映像儲存**
          ```
          containerregistry.googleapis.com  # Container Registry API (傳統)
          artifactregistry.googleapis.com   # Artifact Registry API (新版，推薦)
          ```
      3. **CI/CD 與建構**
          ```
          cloudbuild.googleapis.com         # Cloud Build API (自動建構)
          ```
      4. **權限與安全**
          ```
          iam.googleapis.com                 # Identity and Access Management API
          cloudresourcemanager.googleapis.com # Resource Manager API (專案管理)
          ```
      5. **網路服務**
          ```
          servicenetworking.googleapis.com   # Service Networking API (VPC 連接)
          dns.googleapis.com                 # Cloud DNS API (如果使用 Cloud DNS)
          ```
          
      </details>

  - [x] **Terraform 資源建立 Checklist：**
    <details>
    <summary><strong>實際要建立的雲端資源</strong></summary>

    |         Terraform Resource         |     內容     |
    | ---------------------------------- | ------------ |
    | google_project_service             | API 啟用 |
    | google_container_cluster           | GKE Autopilot 叢集 |
    | google_compute_network             | VPC 網路 |
    | google_compute_subnetwork          | 子網路 |
    | google_compute_firewall            | 防火牆規則 |
    | google_compute_router              | Cloud Router（NAT 用） |
    | google_compute_router_nat          | NAT Gateway（私有集群外網訪問） |
    | google_container_registry          | Container Registry（或 Artifact Registry） |
    | google_compute_address             | 靜態外部 IP（LoadBalancer 用） |
    | google_project_iam_member          | IAM 權限設定 |
    | google_service_account             | GKE 節點服務帳戶 |
    | helm_release                       | cert-manager Helm Chart |
    | kubernetes_manifest                | Let's Encrypt ClusterIssuer |
    | cloudflare_record                  | DNS A 記錄（自動綁定靜態 IP） |
   
    </details>

- [x] **2. 創建主要配置檔案：**
  - [x] `main.tf` - 主要資源定義（GCP 基礎設施）
  - [x] `variables.tf` - 變數定義
  - [x] `outputs.tf` - 輸出值（叢集端點、IP 等）
  - [x] `versions.tf` - Provider 版本鎖定
    - GCP Provider 配置
    - 新增 Cloudflare Provider 配置
    - 新增 Helm Provider 配置（依賴 GKE 叢集）
    - 新增 Kubernetes Provider 配置（依賴 GKE 叢集）
  - [x] `variables.tf` - 變數定義補齊
    - 基礎 GCP 變數
    - 新增域名相關變數 (domain_name, cloudflare_email, cloudflare_api_token, letsencrypt_email)
  - [x] `cert-manager.tf` - cert-manager Helm chart 和 Let's Encrypt ClusterIssuer
  - [x] `dns.tf` - Cloudflare DNS A 記錄自動配置
  - [x] `terraform.tfvars` - 實際變數值
    - `cp terraform.tfvars.example terraform.tfvars`
  - [ ] `backend.tf` – Remote State 設定（GCS）
  - [ ] GCS Bucket 建立與版本管理
    - `gsutil mb -p $PROJECT_ID -c standard -l asia-east1 gs://tfstate-ton-cat-lottery`
    - `gsutil versioning set on gs://tfstate-ton-cat-lottery`
  - [ ] Terraform 服務帳戶授權
    - 角色：`roles/storage.objectAdmin` ＋ `roles/storage.objectViewer`

- [x] **3. 測試基礎 Terraform 流程（分階段部署）：**
  - [x] **3-1. 基礎設施**：
    - [ ] 首次遷移 Remote State：`terraform init -migrate-state`
    - [x] 檢查 GCP 基礎設施: `terraform plan -target=module.gcp_infrastructure`
    - [x] 先部署 GCP 基礎設施: `terraform apply -target=module.gcp_infrastructure`
    - [x] **驗證**：確保 GKE 叢集正常運作：`kubectl get nodes`
    - [ ] **並行鎖測試**：兩台機器同時 `terraform plan`，其中一端應收到 state-lock 錯誤

  - [x] **3-2. SSL 和 DNS**：
    - `terraform plan -target=helm_release.cert_manager` - 檢查 cert-manager 部署
    - `terraform apply -target=helm_release.cert_manager` - 部署 cert-manager
    - `terraform plan -target=kubernetes_manifest.letsencrypt_issuer` - 檢查 ClusterIssuer
    - `terraform apply -target=kubernetes_manifest.letsencrypt_issuer` - 部署 ClusterIssuer
    - `terraform plan -target=cloudflare_record.app_dns` - 檢查 DNS 記錄
    - `terraform apply -target=cloudflare_record.app_dns` - 建立 DNS A 記錄
  - [x] **3-3. 完整驗證**：  
    - `terraform plan` - 檢查完整部署計畫
    - `terraform apply` - 執行完整部署
    - **驗證**：確保所有資源正常運作且 HTTPS 可訪問


- [x] **4. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for terraform
  - [x] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段4：K8s 應用部署準備（手動驗證一次）：

- [x] **1. 準備階段：**
  - [x] 確認 Terraform 基礎設施已部署完成
  - [x] 驗證 GKE Autopilot 叢集狀態：`kubectl get nodes`
  - [x] 確認 Artifact Registry 已創建並可訪問

- [x] **2. 建構與推送容器映像：**
  - 配置 Docker 認證：`gcloud auth configure-docker asia-east1-docker.pkg.dev`
  - **重要**：設定 Docker buildx 多架構支援：`docker buildx create --use --name multiarch`
  - 建構 backend Docker Image (x86_64)：`docker buildx build --platform linux/amd64 -f docker/Dockerfile.backend -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:$(git rev-parse --short HEAD) -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest --push .`
  - 建構 frontend Docker Image (x86_64)：`docker buildx build --platform linux/amd64 -f docker/Dockerfile.frontend --target production -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:$(git rev-parse --short HEAD) -t asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/frontend:latest --push .`
  - **驗證映像**：確認映像架構正確：`docker manifest inspect asia-east1-docker.pkg.dev/PROJECT_ID/ton-cat-lottery/backend:latest`

- [x] **3. 構建 K8s 部署檔案：**
  - 組織 `k8s/` 目錄結構（backend/, frontend/, config/）
  - 創建 ConfigMap 管理環境變數（backend-config.yaml, frontend-config.yaml）
  - 創建 Secret 管理敏感資訊（backend-secrets.yaml）
  - 優化 backend Deployment YAML（資源限制、健康檢查、標籤策略）
  - 優化 frontend Deployment YAML（資源限制、健康檢查、標籤策略）
  - 重寫 backend Service YAML（ClusterIP，因為不需要外部訪問）
  - 重寫 frontend Service YAML（ClusterIP）
  - 創建 `k8s/ingress/` 目錄
  - 創建 Ingress YAML（支援 HTTPS、域名、TLS 配置）
  - 添加 NetworkPolicy YAML（網路安全隔離）

- [x] **4. 安全性和生產準備：**
  - 移除硬編碼的測試值，使用 Secret 和 ConfigMap
  - 配置適當的資源請求和限制
  - 添加 Pod Security Context（非 root 用戶）
  - 配置 Horizontal Pod Autoscaler (HPA)
  - 設定適當的 labels 和 annotations

- [x] **5. 手動測試一次完整部署流程（待 SSL 和 DNS 配置完成後）：**
  - 取得 GKE 叢集憑證：`gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1`
  - 創建命名空間：`kubectl create namespace ton-cat-lottery`
  - 部署 ConfigMaps 和 Secrets：`kubectl apply -f k8s/config/`
  - 手動部署 backend：`kubectl apply -f k8s/backend/`
  - 手動部署 frontend：`kubectl apply -f k8s/frontend/`
  - 部署 Ingress：`kubectl apply -f k8s/ingress/`（等待 Ingress YAML 創建完成）

- [x] **6. 驗證應用（待完整部署後進行）：**
  - 檢查所有 Pod 狀態為 Running：`kubectl get pods -n ton-cat-lottery`
  - 檢查 Service 正常工作：`kubectl get svc -n ton-cat-lottery`
  - 檢查 Ingress 取得外部 IP：`kubectl get ingress -n ton-cat-lottery`
  - 測試內部服務連通性：`kubectl exec -it POD_NAME -- curl backend-service`
  - 驗證應用可以透過 Ingress IP 訪問
  - 驗證 DNS 解析：`nslookup your-domain.com`
  - 測試 HTTPS 證書自動配置：`kubectl get certificate -n ton-cat-lottery`
  - 測試完整 HTTPS 訪問：`curl -I https://your-domain.com`
  - 檢查日誌和監控指標
  - 測試 Pod 自動重啟和擴縮容
  - 驗證網路策略生效（如有配置）

- [ ] **7. 效能和監控驗證：**
  - 配置 Google Cloud Monitoring 集成
  - 設定日誌收集和查詢
  - 測試應用在負載下的表現
  - 驗證 HPA 自動擴縮容功能

- [x] **8. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for k8s
  - [x] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---

#### 階段 5：自動化部署（GitHub Actions CI/CD）：

>技術：GitHub Actions + GCP

**目標： 自動化驗證和部署到 GCP（採用 Workload Identity Federation）**

##### **基礎流程 (必要)：基本 DevOps**

- [x] **1. 準備階段：**
  - [x] 建立 `.github/workflows/` 目錄結構
  - [x] 一次性 WIF 設定
    - 建立 Service Account gha-deploy 並授權所需角色
    - 建立 Workload Identity Pool & Provider（issuer: https://token.actions.githubusercontent.com）
    - 將 YOURORG/your-repo 與 gha-deploy 綁定 `roles/iam.workloadIdentityUser`

- [x] **2. 基礎 CI 工作流程 (`ci.yml`)：**
  - [x] **核心代碼品質檢查：**
    - [x] 智能合約測試：`cd contracts && npm run test`
    - [x] 前端建構測試：`cd frontend && npm run build`
    - [x] Go 後端測試：`cd backend && ./test.sh`
  
  - [x] **基礎 Docker 建構：**
    - [x] 建構 backend Docker 映像
    - [x] 建構 frontend Docker 映像
    - [x] 驗證映像建構成功
  
  - [x] **登入 GCP（OIDC）：**
    ```yml
    - id: auth
      uses: google-github-actions/auth@v2
      with:
        token_format: 'access_token'
        workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
        service_account: 'gha-deploy@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com'
    ```
    - [x] 安裝 gcloud、kubectl 等 CLI

- [x] **3. 基礎 CD 工作流程 (`cd.yml`)：**
  - [x] **簡單觸發條件：**
    - [x] 手動觸發部署選項 (workflow_dispatch)
    - [x] `main` 分支推送自動部署
  
  - [x] **映像推送到 Artifact Registry：**
    - [x] 配置 GCP 認證：使用 `google-github-actions/auth@v2`
    - [x] 配置 Docker 認證：`gcloud auth configure-docker`
    - [x] 推送 backend 映像：基礎標籤策略 (latest, git-sha)
    - [x] 推送 frontend 映像：基礎標籤策略 (latest, git-sha)
    - [x] **驗證映像推送成功**：檢查 Artifact Registry
  
  - [x] **GKE 部署：**
    - [x] 取得 GKE 憑證：gcloud container clusters get-credentials …
    - [x] 滾動更新：kubectl set image deployment/backend …、deployment/frontend …
    - [x] kubectl rollout status 等待完成
  
  - [x] **部署驗證：**
    - [x] 確認所有 Pod Running
    - [x] 服務連通性測試

- [x] **4. GitHub Secrets 配置：**
  - [x] **GCP OIDC 認證 (必要)**：
    - [x] `GCP_PROJECT_ID`：`ton-cat-lottery-dev-2`
    - [x] `GCP_WIF_PROVIDER`：Workload Identity Provider 路徑
  - [x] **Cloudflare & Domain (選用)**：
    - [x] `CLOUDFLARE_EMAIL`：`gba115566@gmail.com`
    - [x] `CLOUDFLARE_API_TOKEN`：Cloudflare API Token
    - [x] `CLOUDFLARE_ZONE_ID`：`c90d2fca6fa4b3cea3d8360f0649294a`
    - [x] `LETSENCRYPT_EMAIL`：`gba115566@gmail.com`
    - [x] `APP_DOMAIN`：`cat-lottery.chaowei-liu.com`

- [x] **5. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for ci/cd
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

#### 階段 6：整理 Documentations
- [ ] 整理 Contracts 的 `README.md`
- [ ] 整理 Backend 的 `README.md`
- [ ] 整理 Frontend 的 `README.md`
- [ ] 整理 DevOps 的 `README.md`
- [ ] 整理 主目錄的 `README.md`