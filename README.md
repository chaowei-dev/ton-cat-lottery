# 🐱 TON Cat Lottery — Web3 貓咪 NFT 抽獎平台

> 一個基於 TON 區塊鏈的鏈上抽獎系統，參加者可支付少量 TON 參與抽獎，有機會贏得限量版貓咪 NFT。前端使用 React + TonConnect，後端為 Go 語言實作自動抽獎機器人，整體部署採用容器（Docker）化，並整合 CI/CD 與監控。

---

## ✨ 專案亮點

- 🚀 **全鏈上邏輯**：使用 Tact 撰寫智能合約，負責抽獎與 NFT 發送
- 🦾 **後端自動化抽獎機器人**：Go 撰寫 RPC 調用邏輯，自動觸發中獎邏輯
- 💻 **前端與錢包互動**：React + TonConnect，與 TON 錢包整合參與抽獎
- 📦 **Docker 容器化**：後端、前端、節點、監控模組皆為獨立容器
- ⚙️ **完整 DevOps 管線**：Terraform、GitHub Actions、Prometheus、Grafana
- 🧩 **NFT 合約**：支援隨機發送限量貓咪 NFT，符合 TON NFT 標準

---

## 🖼️ 系統架構圖

```
[使用者] ⇄ [React 前端 dApp] ⇄ [TON 智能合約 + TON Node]
  ⇓
[Go RPC Server 自動抽獎]
  ⇓
[NFT 發送 / 鏈上結果通知]
  ⇓
[Prometheus + Grafana 監控模組]
```

---

## 📦 專案目錄結構

```bash
ton-cat-lottery/
├── contracts/             # Tact 智能合約
│   ├── CatLottery.tact        # 主抽獎合約
│   ├── CatNFT.tact            # 貓咪 NFT 合約
│   ├── tact.config.json       # Tact 編譯配置
│   ├── scripts/               # 部署與互動腳本
│   │   ├── deploy.ts          # 抽獎合約部署
│   │   ├── deploy-nft.ts      # NFT 合約部署
│   │   ├── interact.ts        # 合約互動
│   │   └── verify.ts          # 合約驗證
│   ├── tests/                 # 合約測試
│   │   └── CatLottery.test.ts # 抽獎合約測試
│   └── build/                 # 構建產物
│       ├── CatLottery_*       # 抽獎合約構建文件
│       └── CatNFT_*           # NFT 合約構建文件
├── backend/               # Go 抽獎機器人服務
│   ├── main.go               # 主程式入口
│   ├── go.mod                # Go 模組定義
│   ├── test.sh               # 測試腳本
│   ├── config/               # 配置模組
│   ├── pkg/                  # 公共包
│   │   └── logger/           # 日誌模組
│   │       ├── logger.go
│   │       └── logger_test.go
│   └── internal/             # 內部業務模組
│       ├── config/           # 配置管理
│       ├── lottery/          # 抽獎核心邏輯
│       │   ├── service.go
│       │   ├── service_test.go
│       │   └── integration_test.go
│       ├── wallet/           # 錢包管理
│       │   ├── manager.go
│       │   └── manager_test.go
│       ├── transaction/      # 交易監控
│       │   ├── monitor.go
│       │   └── monitor_test.go
│       └── ton/              # TON 區塊鏈客戶端
│           ├── client.go
│           └── client_test.go
├── frontend/              # React + TonConnect 前端 dApp
│   ├── package.json          # NPM 依賴管理
│   ├── vite.config.ts        # Vite 構建配置
│   ├── tsconfig.json         # TypeScript 配置
│   ├── index.html            # HTML 入口
│   ├── public/               # 靜態資源
│   │   ├── index.html
│   │   ├── tonconnect-manifest.json
│   │   └── vite.svg
│   └── src/                  # 源代碼
│       ├── main.tsx          # React 入口
│       ├── App.tsx           # 主應用組件
│       ├── App.css           # 應用樣式
│       ├── index.css         # 全局樣式
│       ├── components/       # React 組件
│       │   ├── WalletConnect.tsx     # 錢包連接組件
│       │   ├── ContractStatus.tsx    # 合約狀態顯示
│       │   ├── JoinLottery.tsx       # 參與抽獎組件
│       │   └── Toast.tsx             # 通知組件
│       ├── services/         # 業務服務
│       │   └── contractService.ts    # 合約服務
│       ├── hooks/            # React Hooks
│       │   └── useToast.ts
│       ├── styles/           # 樣式文件
│       ├── assets/           # 靜態資源
│       └── utils/            # 工具函數
├── monitoring/            # Prometheus / Grafana 設定
│   ├── prometheus.yml
│   └── dashboards/
├── docker/                # 各模組 Dockerfile
│   ├── Dockerfile.frontend
│   └── Dockerfile.backend
├── .github/workflows/     # GitHub Actions CI/CD 設定
│   └── deploy.yml
└── README.md
```

---

## 🧠 核心功能模組

### 🎯 智能合約（CatLottery.tact）

- 完整合約說明請參考： [NFT 合約文檔](contracts/NFTREADME.md)
- 故事說明請參考： [貓咪樂園抽獎故事](contracts/NFTStory.md)
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

- 完整後端說明請參考： [後端文檔](backend/BackREADME.md)
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
- 用戶體驗優化 (響應式設計)

---

## ⚙️ DevOps 架構細節

- Docker 說明請參考： [Docker 文檔](docker/DockerREADME.md)
- 使用 Docker Compose 啟動完整環境（前後端 + Node + 監控）
- Prometheus 收集：
  - Node block 高度、延遲
  - 抽獎成功率
  - NFT 傳送錯誤率
- Grafana 視覺化儀表板：可視化抽獎活動、服務狀態
- GitHub Actions 自動化：
  - Commit → 編譯 → 自動部署至 VPS

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

| 類別     | 技術                            |
| -------- | ------------------------------- |
| 區塊鏈   | TON, Tact, TonConnect           |
| 後端     | Go, TonCenter API, Cobra CLI    |
| 前端     | React, TonConnect UI SDK        |
| 部署     | Docker, GitHub Actions          |
| 監控     | Prometheus, Grafana             |
| 基礎設施 | Terraform, GCP, Ansible（選配） |

---

## 🧑‍💻 開發者

作者：Chao-Wei, Liu
Email：liu.chaowei.dev@gmail.com
版本：beta-0.0.1

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
- [x] 部署抽獎合約到 TON 測試網
- [ ] 部署 NFT 合約到 TON 測試網

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

- 核心業務邏輯**

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

### DevOps / 部署自動化

> 整合三個組建，透過容器化部署，並整合 CI/CD 與監控。

- [x] 撰寫 `Dockerfile`（backend）
- [x] 撰寫 `Dockerfile`（frontend）
- [x] 撰寫 `docker-compose.yml` 整合後端 / 前端
- [x] 撰寫 `.env` 檔案與 secret 管理
- [ ] 撰寫 GitHub Actions CI/CD：
  - [ ] Push ➜ 自動建構 ➜ SSH deploy ➜ 重啟容器
- [ ] 撰寫 Ansible Playbook 安裝 Docker 與初始化 VPS（選配）
- [ ] 測試端到端部署流程（本地 → VPS）

### 監控與可視化（Prometheus + Grafana）

> 讓系統具備自動部署與健康狀態監控。

- [ ] 撰寫 `prometheus.yml` 配置（包含 backend、node_exporter）
- [ ] 安裝 `node_exporter` 並接入主機 metrics
- [ ] 撰寫 Go 自定義 `/metrics` endpoint（記錄抽獎次數、失敗數）
- [ ] 安裝與設定 Grafana Dashboard（支援 TON Node、抽獎資料）
- [ ] 儀表板顯示項目：
  - [ ] 抽獎次數
  - [ ] NFT 發送錯誤率
  - [ ] 節點同步狀態（延遲區塊高度）

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
