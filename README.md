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
│   └── CatLottery.tact
├── backend/               # Go 抽獎機器人服務
│   └── main.go
├── frontend/              # React + TonConnect 前端 dApp
│   └── src/
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

```typescript
// CatLottery.tact
join(): 支付 TON 並加入抽獎池  
drawWinner(): 隨機選出中獎者並發送 NFT  
sendNFT(address): 調用 NFT 合約並發送對應貓咪 NFT  
```

### 🧰 後端自動抽獎機器人（Go）

- 定時輪詢 TON 鏈上狀態，觸發 drawWinner
- 通過 TON API（TonCenter）查詢參與者與交易狀態
- 自動推播通知或上傳中獎記錄（可連接 Discord / Telegram）

### 💻 前端 dApp

- 使用 TonConnect SDK 連接 Tonkeeper 錢包
- 顯示目前抽獎狀態、參加者數量、中獎歷史
- 使用者可一鍵參加抽獎（發送 join() 交易）

---

## ⚙️ DevOps 架構細節

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
- Node.js >= 
- Go >= 
- Docker & Docker Compose
- Tact CLI (`npm install -g tact`)
```

---

## 🚀 快速啟動指南

### 1️⃣ Clone 專案並安裝依賴

```bash
git clone https://github.com/yourname/ton-cat-lottery.git
cd ton-cat-lottery
```

### 2️⃣ 啟動所有容器

```bash
docker-compose up --build -d
```

### 3️⃣ 編譯並部署智能合約（首次執行）

```bash
cd contracts
tact compile CatLottery.tact
tact deploy CatLottery
```

### 4️⃣ 開啟前端：瀏覽 http://localhost:3000

---

## 🧪 測試指令

- 單元測試 Go 自動抽獎腳本

```bash
cd backend
go test ./...
```

- 合約模擬測試

```bash
tact test CatLottery.tact
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

| 類別     | 技術                         |
| -------- | ---------------------------- |
| 區塊鏈   | TON, Tact, TonConnect        |
| 後端     | Go, TonCenter API, Cobra CLI |
| 前端     | React, TonConnect UI SDK     |
| 部署     | Docker, GitHub Actions       |
| 監控     | Prometheus, Grafana          |
| 基礎設施 | Terraform, GCP, Ansible（選配）   |

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
> 
- [ ] 初始化 `CatLottery.tact` 合約結構（定義 join/drawWinner/sendNFT）
- [ ] 設計儲存參加者資料的 Cell 結構（儲存地址列表）
- [ ] 實作 `join()` 方法（收款 + 儲存參與者）
- [ ] 實作 `drawWinner()` 方法（根據 block hash 隨機選取）
- [ ] 實作 `sendNFT(address)`：觸發 NFT 合約轉移
- [ ] 撰寫單元測試腳本（測試參加、抽獎、轉移邏輯）
- [ ] 使用 `tact` CLI 部署至 testnet
- [ ] 撰寫 NFT 合約（符合 TON NFT 規範，支援 metadata）
- [ ] 鑄造並部署預設的 NFT（貓咪圖像）

### 後端服務模組（Go）

> 需要 Go 來實作自動抽獎邏輯和 RPC 調用智能合約的工具。

- [ ] 初始化 Go 專案與模組設定
- [ ] 撰寫 TonCenter API 請求模組（查詢鏈上資料）
- [ ] 撰寫 `FetchParticipants()` 函數：從鏈上獲取參加者清單
- [ ] 撰寫 `TriggerDrawWinner()` 函數：發送抽獎交易至智能合約
- [ ] 撰寫 `SendNFT()` 函數：調用 NFT 合約轉移函數
- [ ] 實作排程（cron job 或 goroutine）定時抽獎
- [ ] 撰寫 REST API 查詢接口（選配）
- [ ] 撰寫單元測試與錯誤處理邏輯

### 前端 dApp（React + TonConnect）

> 在智能合約初步穩定後，你可以建立 dApp 前端與錢包互動。

- [ ] 初始化 React 專案並設定 Tailwind（或任一 CSS 框架）
- [ ] 整合 TonConnect SDK 與 Tonkeeper 錢包連結功能
- [ ] 顯示目前合約抽獎狀態（參與人數、倒數時間）
- [ ] 實作參加抽獎按鈕（呼叫 `join()`）
- [ ] 顯示中獎歷史紀錄（來自鏈上或 API）
- [ ] 顯示用戶持有的 NFT 圖像（透過 metadata URL）
- [ ] NFT 收藏區功能（列出持有的貓咪）

### DevOps / 部署自動化

> 整合三個組建，透過容器化部署，並整合 CI/CD 與監控。

- [ ] 撰寫 `Dockerfile`（backend）
- [ ] 撰寫 `Dockerfile`（frontend）
- [ ] 撰寫 `docker-compose.yml` 整合後端 / 前端 / TON Node
- [ ] 撰寫 `.env` 檔案與 secret 管理
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