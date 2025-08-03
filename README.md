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
- **NFT 合約**：支援隨機發送限量貓咪 NFT，符合 TON NFT 標準

---

## 🖼️ 系統架構圖
![architecture](architecture.png)


---

## 📦 專案目錄結構

```bash
ton-cat-lottery/
├── contracts/                # Tact 智能合約
│   ├── CatLottery.tact       # 主抽獎合約
│   ├── CatNFT.tact           # 貓咪 NFT 合約
│   ├── scripts/              # 部署與互動腳本
│   └── tests/                # 合約測試
├── backend/                  # Go 抽獎機器人服務  
│   ├── main.go
│   ├── internal/             # 核心業務邏輯
│   │   ├── lottery/          # 抽獎邏輯
│   │   ├── wallet/           # 錢包管理
│   │   └── ton/              # TON 客戶端
│   └── pkg/logger/           # 日誌工具
├── frontend/                 # React dApp
│   ├── src/
│   │   ├── components/       # React 組件
│   │   └── services/         # 合約服務
│   └── public/               # 靜態資源
├── docker/                   # 前端/後端容器話設定
├── terraform/                # terraform 基礎設施部署設定
├── .github/workflows/        # CI/CD 配置
├── docker-compose.yml        # Docker 容器編排
└── README.md
```

---

## 🧠 核心功能模組

### 🎯 智能合約（CatLottery.tact）

- 完整合約說明請參考： [NFT 合約文檔](docs/NFTREADME.md)
- 故事說明請參考： [貓咪樂園抽獎故事](docs/NFTStory.md)
- 定義抽獎規則 (3 人滿員抽獎)
- 管理參與者資料 (地址、費用、時間)
- 執行隨機抽獎 (基於區塊鏈隨機性)
- 發送 NFT 給中獎者
- 管理合約狀態 (活躍/非活躍)
- Function:
  ```typescript
  // CatLottery.tact
  join(): 支付 TON 並加入抽獎池
  drawWinner(): 隨機選出中獎者並發送 NFT
  sendNFT(address): 調用 NFT 合約並發送對應貓咪 NFT
  ```

### 🧰 後端自動抽獎機器人（Go）

- 完整後端說明請參考： [後端文檔](docs/BackREADME.md)
- 定時檢查合約狀態 (每 30 分鐘)
- 自動觸發抽獎 (當人數達到 3 人)
- 發送 drawWinner 交易
- 監控交易結果
- 記錄抽獎歷史

### 💻 前端 dApp

- 使用 TonConnect SDK 連接 Tonkeeper 錢包
- 顯示合約狀態 (參與人數、費用、輪次)
- 參與抽獎功能 (發送 join 交易)
- 交易狀態提示 (成功/失敗通知)

---

## ⚙️ DevOps 架構細節

### 容器化架構
- **Docker 說明請參考：** [Docker 文檔](docs/DockerREADME.md)
- **多服務容器編排：** Docker Compose 統一管理前端 React dApp、Go 後端服務、TON 節點，實現本地開發環境一鍵啟動
- **分層鏡像優化：** 前端使用 Nginx Alpine 基底，後端使用 Go Alpine 多階段構建，減少鏡像體積

### 雲端基礎設施
- **GCP 微服務部署：** 使用 GKE Autopilot 自動管理 Kubernetes 叢集，無需手動維護節點
- **Terraform Infrastructure as Code：** 
  ```
  ├── VPC 網路 + 子網路配置
  ├── GKE 叢集 (Autopilot 模式)
  ├── Container Registry 映像倉庫
  ├── 靜態外部 IP + LoadBalancer
  └── IAM 服務帳戶權限管理
  ```
- **服務發現：** Kubernetes Service + Ingress 控制器處理流量路由

### CI/CD 自動化管線
- **GitHub Actions 工作流：**
  ```
  Code Push → Unit Tests → Docker Build → 
  Push to GCR → Deploy to GKE → Health Check
  ```
- **多環境部署策略：** 
  - `main` 分支自動部署到生產環境
  - `develop` 分支部署到測試環境
  - Pull Request 觸發臨時預覽環境

### 監控與可觀測性
- **業務指標監控：** Prometheus 收集 TON 區塊鏈節點狀態、抽獎成功率、NFT 轉移狀態
- **系統監控：** CPU、記憶體、網路、存儲使用率實時追蹤
- **Grafana 視覺化：** 自定義儀表板顯示抽獎活動熱力圖、系統健康度、用戶行為分析
- **告警機制：** 當抽獎失敗率 > 5% 或系統響應時間 > 2s 時自動發送 Slack 通知

### 安全與合規
- **容器安全：** 集成 Trivy 掃描器檢測映像漏洞，阻止高風險映像部署
- **秘密管理：** 使用 Google Secret Manager 存儲私鑰、API Token，避免硬編碼
- **網路安全：** GKE 私有叢集 + VPC 防火牆規則，限制不必要的外部訪問

---

## 🛠️ 環境需求

```
- Node.js >= 22.18.0
- Go >= 1.24.5
- Docker & Docker Compose
- Tact CLI
```

---

## 🧪 測試指令

### 測試智能合約

```bash
cd contracts
npm run test
```

### 測試 Go 後端

```bash
cd backend
./test.sh
```

### 測試前端

```bash
cd frontend
npm run build
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

## 🚀 快速開始

1. 部署智能合約，請參考：[智能合約部署](#智能合約部署)

2. 新增環境變數

```bash
cp .env.example .env
```

3. 使用 docker compose 啟動所有服務

```bash
docker compose up -d
```

---

## 📈 示意圖（可放到 GitHub）

- dApp 操作畫面截圖:
<!-- Image of dApp -->

- NFT 顯示圖:
<!-- Image of NFT -->

- Grafana 監控圖:
<!-- Image of Grafana -->

---

## 📚 技術棧

| 類別     | 技術                           |
| -------- | ------------------------------ |
| 程式語言 | Typescript, Go, Node.js, React |
| 區塊鏈   | TON, Tact, TonConnect          |
| 後端     | Go, Node.js                    |
| 前端     | React                          |
| 部署     | Docker, GitHub Actions, k8s    |
| 監控     | Prometheus, Grafana            |
| 基礎設施 | Terraform, GCP                 |

---

## 🏁 TODO Checklist - 功能導向模組拆解

> 本清單依照功能模組拆解為可執行任務，便於開發與進度追蹤。

### 智能合約模組（Tact）

> 定義好「抽獎怎麼運作」「怎麼發 NFT」「參與者怎麼加入」。

- [x] 初始化 `CatLottery.tact` 合約結構（定義 join/drawWinner/sendNFT）
- [x] 設計儲存參加者資料的 Cell 結構（儲存地址列表）
- [x] 實作 `join()` 方法（收款 + 儲存參與者）
- [x] 實作 `drawWinner()` 方法（根據 block hash 隨機選取）
- [x] 實作 `sendNFT(address)`：觸發 NFT 合約轉移
- [x] 撰寫單元測試腳本（測試參加、抽獎、轉移邏輯）
- [x] 使用 `tact` CLI 部署至 testnet
- [x] 撰寫 NFT 合約（符合 TON NFT 規範，支援 metadata）
- [x] 鑄造並部署預設的 NFT（貓咪圖像）
- [x] 部署抽獎合約到 TON testnet
- [ ] 部署 NFT 合約到 TON testnet

### 後端服務模組（Go）

> 精簡版後端，專注於核心抽獎功能，減少實作複雜度但保持專案完整性。

- 基礎設施

  - [x] 初始化 Go 專案與模組設定（go.mod, 目錄結構）
  - [x] 基礎配置管理（環境變數、合約地址、私鑰）
  - [x] 基礎日志記錄（可用標準 log 套件）

- 智能合約互動

  - [x] 撰寫 TonCenter API 客戶端（基礎查詢功能）
  - [x] 實作錢包管理與交易簽名
  - [x] 核心抽獎功能：
    - [x] `GetContractInfo()` - 查詢抽獎狀態
    - [x] `SendDrawWinner()` - 執行抽獎
    - [x] `SendStartNewRound()` - 開始新輪次
  - [x] 基礎交易監控（檢查交易是否成功）

- 核心業務邏輯

  - [x] 實作自動抽獎定時器（簡單 cron job 或 ticker）
  - [x] 基礎抽獎流程控制（檢查條件 → 執行抽獎 → 記錄結果）
  - [x] 簡單錯誤處理與重試機制

- 基礎測試

  - [x] 撰寫核心功能單元測試
  - [x] 基礎集成測試（抽獎流程測試）

- 實際測試
  - [ ] 鏈接到監控合約，並進行監控
  - [ ] 鏈接到抽獎合約，並進行抽獎
  - [ ] 鏈接到 NFT 合約，並進行 NFT 發送

### 前端 dApp（React + TonConnect）

> 在智能合約初步穩定後，你可以建立 dApp 前端與錢包互動。

#### 基本功能

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

#### 進階功能

- [ ] 實作即時狀態更新 - 定期刷新合約狀態（每 30 秒）
- [ ] 顯示獎池資訊 - 當前合約餘額和預計獎金
- [ ] 基礎響應式設計 - 支援手機和桌面瀏覽

### DevOps / 雲端自動化部署

> 階段式 DevOps 實作流程：Docker + Kubernetes + GCP + Terraform + CI/CD + GitHub Actions

| 階段 | 內容                    | 技術                       | 目標       |
| ---- | ----------------------- | -------------------------- | ---------- |
| 1    | 基礎容器化              | Docker + Docker Compose    | 本地環境   |
| 2    | GCP 環境建立與手動部署  | GCP + GKE + k8s + Docker   | 雲端驗證   |
| 3    | Terraform + 基礎 CI/CD  | Terraform + GitHub Actions | 自動化基礎 |
| 4    | 完整 CI/CD Pipeline     | GitHub Actions + Multi-env | 企業級流程 |
| 5    | 進階 DevOps（未來實作） | 完整工具鏈                 | 生產就緒   |

#### 階段 1：基礎容器化

**技術棧：Docker + Docker Compose**
**目標：建立容器化設定檔**

- [x] 撰寫 `Dockerfile`（backend）
- [x] 撰寫 `Dockerfile`（frontend）
- [x] 撰寫 `docker-compose.yml` 整合後端 / 前端
- [x] 撰寫 `.env` 檔案與 secret 管理
- [x] 本地 Docker 環境驗證與測試

#### 階段 2：GCP 環境建立與手動部署

**技術棧：GCP Console + 手動設定**  
**目標：建立雲端基礎環境**

- [x] 註冊 GCP 帳號（新用戶可獲得 $300 免費額度）
- [x] 建立專案 `ton-cat-lottery-dev`
- [ ] 啟用必要 API：
  - [ ] 啟用 `Kubernetes Engine API`
  - [ ] 啟用 `Container Registry API`
  - [ ] 啟用 `Cloud Build API`
  - [ ] 啟用 `Compute Engine API`
- [ ] 本地開發工具：
  - [ ] 安裝 Google Cloud SDK
  - [ ] 設定認證：gcloud auth login
  - [ ] 設定專案：gcloud config set project ton-cat-lottery-dev
  - [ ] 安裝 kubectl：gcloud components install kubectl
- [ ] 服務帳戶與權限設定：
  - [ ] 建立 Terraform 服務帳戶
  - [ ] 分配必要權限（Kubernetes Engine Admin, Storage Admin 等）
  - [ ] 下載服務帳戶金鑰 JSON 檔案
  - [ ] 驗證：測試 gcloud auth activate-service-account 正常運作


#### 階段 3：基礎自動化部署

**技術棧：Terraform + GitHub Actions + GEK**  
**目標：用 Infrastructure as Code 建立完整雲端環境**

##### **Terraform 基礎設施即代碼：**

- [ ] 建立 terraform/ 目錄結構
- [ ] Terraform 部署 Checklist（基礎設施清單）：
  |         terraform          |     內容     |
  | -------------------------- | ---------------- |
  |google_container_cluster    | GKE Autopilot 叢集|
  | google_compute_network     | VPC 網路 |
  | google_compute_subnetwork  | 子網路 |
  | google_compute_firewall    | 防火牆規則 |
  | google_container_registry  | Container Registry（或 Artifact Registry） |
  | google_compute_address     | 靜態外部 IP（LoadBalancer 用） |
  | google_project_iam_binding | IAM 權限設定 |
  | google_service_account     | GKE 節點服務帳戶 |
 - [ ] 創建主要配置檔案：
    ```
    main.tf - 主要資源定義
    variables.tf - 變數定義
    outputs.tf - 輸出值（叢集端點、IP 等）
    versions.tf - Provider 版本鎖定
    ```
- [ ] 測試 terraform plan/apply/destroy 流程
- [ ] 驗證：確保 Terraform 可以完整建立/刪除 GKE 環境


- [ ] 容器映像建構與推送：

  - [ ] 建構 backend/frontend Docker Image
  - [ ] 推送 images 到 Google Container Registry
  - [ ] 建立 K8s Deployment 和 Service YAML 檔案
  - [ ] 手動測試一次完整部署流程

##### **GitHub Actions CI/CD**：
- [ ] 創建 CI
- [ ] 創建 CD
- [ ] 設定 GitHub Secrets (GCP 服務帳戶金鑰)
- [ ] 驗證：推送代碼後自動觸發部署
- [ ] 域名與 LoadBalancer 設定：
  - [ ] 用 Terraform 建立 LoadBalancer Service
  - [ ] 取得外部 IP 並設定 Cloudflare DNS
  - [ ] 驗證：確保應用可透過域名正常訪問

#### 階段 4：進階多環境部署 (可選)

**目標：企業級多環境自動化**

- [ ] **多環境 Terraform 配置：**

  - [ ] 建立 dev/staging/prod 環境變數檔案
  - [ ] 配置不同環境的 GKE 叢集規格
  - [ ] 設置環境隔離的網路配置


- [ ] **GitHub Actions 進階工作流程：**

  - [ ] Pull Request 自動測試和預覽部署
  - [ ] 分支策略：dev → staging → prod
  - [ ] 手動審批生產環境部署
  - [ ] 配置環境保護規則和通知

#### 階段 5：進階監控與安全 (未來擴展)

**目標：生產就緒的完整 DevOps**

- [ ] **監控系統：**
  - [ ] Prometheus + Grafana 監控
  - [ ] 自定義指標和告警
  - [ ] 日誌聚合和分析

- [ ] **安全強化：**
  - [ ] 容器安全掃描
  - [ ] 秘密管理優化 (Google Secret Manager)
  - [ ] 網路安全策略和 WAF

- [ ] **成本優化：**
  - [ ] 資源使用監控
  - [ ] GKE 自動縮放策略
  - [ ] 成本告警和優化建議

### 測試與驗證

> 確保各模組運作正常，並驗證整體流程。

- [ ] 單元測試（Go 抽獎邏輯）
- [ ] 合約模擬測試（join/draw/sendNFT）
- [ ] 前端交易模擬測試（使用測試錢包）
- [ ] 整合測試：參加 ➜ 抽獎 ➜ NFT 發送 ➜ 前端顯示
- [ ] 多用戶壓力測試（使用 Locust 或腳本）

### 文件與展示

- [ ] 完善 `README.md`（專案簡介、啟動指南、技術棧）
- [ ] 撰寫部署教學文件（含 VPS、Docker、CI/CD）
- [ ] 製作操作畫面截圖與影片 demo
- [ ] 撰寫使用說明與常見問題 FAQ
- [ ] 製作開源版本發佈（版本化管理）
