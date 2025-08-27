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

## 📋 目錄

- [🖼️ 系統架構圖](#️-系統架構圖)
- [🛠️ 開發工具](#️-開發工具)
- [📦 專案目錄結構](#-專案目錄結構)
- [🧠 核心功能模組](#-核心功能模組)
  - [🎯 智能合約（CatLottery.tact）](#-智能合約catlotterytact)
  - [🧰 後端自動抽獎機器人（Go）](#-後端自動抽獎機器人go)
  - [⚙️ DevOps 架構細節](#️-devops-架構細節)
- [🚀 智能合約](#-智能合約)
- [📚 技術棧](#-技術棧)
- [🏁 TODO Checklist - 功能導向模組拆解](#-todo-checklist---功能導向模組拆解)

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
---
- 開發流程：
  ![DevFlow](figures/DevFlow.png)

---
- 部署流程：
  ![DevOpsArch](figures/DevOpsArch.png)

### 環境需求
```
- Node.js >= 22.18.0
- Go >= 1.24.5
```

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

[NFT 合約文檔](docs/ContractREADME.md)

[貓咪樂園抽獎故事](docs/NFTStory.md)


### 🧰 後端自動抽獎機器人（Go）

[後端架構文檔](docs/BackendREADME.md)


### ⚙️ DevOps 架構細節

[DevOps文檔](docs/DevOpsREADME.md)

---

## 🚀 智能合約

| 類別        | 合約地址                                            |
| ---------- | -------------------------------------------------- |
| CatLottery | `EQCryV3r0cEnqgvzyWq4yNxubV517muKMYSyoaAWDpOjW1o7` |
| CatNFT     | `EQAe1Lf-KV_IPAfOQ1JJBEZRJ6_5wqyvzW9a_o7kGmpUdsVJ` |

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
| 監控觀測 | Prometheus, Grafana, Alertmanager |

---

## 🏁 TODO Checklist - 功能導向模組拆解

> 本清單依照功能模組拆解為可執行任務，便於開發與進度追蹤。

---
### 智能合約模組（Tact）

> 定義好「抽獎怎麼運作」「怎麼發 NFT」「參與者怎麼加入」。

#### 設計合約和 NFT 相關的邏輯
- [x] 抽獎合約如何定義
- [x] NFT 合約如何定義
- [x] 檢查兩者的邏輯和整合方案

#### 開發
##### 抽獎合約
- [x] 初始化 `CatLottery.tact` 合約結構（定義 join/drawWinner/sendNFT）
- [x] 設計儲存參加者資料的 Cell 結構（儲存地址列表）
- [x] 實作 `join()` 方法（收款 + 儲存參與者）
- [x] 實作 `drawWinner()` 方法（隨機選取中獎者，待整合自動發送 NFT）
- [x] 實作 `sendNFT()` 方法（內建 NFT 發送邏輯，需NFT合約支持）
- [x] 實作 `withdraw()` 方法（提取合約餘額，僅擁有者可調用）
- [x] 實作 `SetNFTContract` 消息處理（設定 NFT 合約地址）
- [x] 實作 `getCatNameByTemplate()` 輔助方法（根據模板 ID 獲取貓咪名稱）
- [x] 設計事件系統（ParticipantJoined, LotteryFull, WinnerDrawn, NFTSent，需完整整合測試）
- [x] 新增 NewRoundStarted 事件（提供更好的狀態監控）
- [x] 實作合約狀態管理（lotteryActive、participantCount、currentRound）
- [x] 實作 `startNewRound()` 方法（重置狀態並開始新輪次）
- [x] 實作合約自動重置機制（drawWinner 後自動清理狀態）
- [x] 實作查詢方法（getContractInfo, getParticipant, getWinner, getBalance）

##### NFT 合約
- [x] 撰寫 `CatNFT.tact` 合約（符合 TON NFT 規範）
- [x] 實作 `MintTo(address)` 方法（接收來自 CatLottery 的鑄造請求）
- [x] 實作 `SetAuthorizedMinter()` 方法（設定授權鑄造者）
- [x] 設計 4 種稀有度貓咪 NFT（Common, Rare, Epic, Legendary）
- [x] 實作 NFT metadata 和貓咪屬性系統  
- [x] 實作 `determineRarity()` 機率系統（Common 60%, Rare 25%, Epic 10%, Legendary 5%）
- [x] 實作 `initializeCatTemplates()` 方法（初始化 4 種貓咪模板）
- [x] 設定 NFT 合約與抽獎合約的授權機制
- [x] 實作查詢方法（getNFT, balanceOf, getCatTemplate, getContractInfo, getAllCatTemplates）
- [x] 實作 NFT 事件系統（NFTMinted）

##### 部署和測試腳本
- [x] 撰寫 `deployCatLottery.ts` 部署腳本（包含合約驗證和資訊記錄）
- [x] 撰寫 `deployCatNFT.ts` 部署腳本（包含貓咪模板驗證）
- [x] 撰寫 `integrationTest.ts` 整合測試腳本（完整抽獎流程自動化測試）
- [x] 撰寫 `testNFTContract.ts` NFT 合約邏輯驗證腳本

##### 配置文件
- [x] 更新 `tact.config.json` 支援雙合約編譯
- [x] 確保合約編譯配置正確（debug 模式、external 設定）

##### 文檔更新
- [x] 完整更新 `docs/ContractREADME.md` 
  - [x] 添加完整檔案結構和函數列表
  - [x] 更新項目概覽包含所有已實作功能
  - [x] 添加 NFT 稀有度系統詳細說明
  - [x] 添加技術特色（安全特性、高可用性、Gas 優化）
  - [x] 添加快速開始指南和部署資訊
  - [x] 添加故障排除指南

#### 測試

##### 單元測試
- [x] **CatLottery 合約單元測試 (40個測試案例)**
  - [x] **合約初始化測試 (1個測試)**
    - [x] 驗證初始化參數正確性 (owner, entryFee, maxParticipants, currentRound, lotteryActive, participantCount, nftContract)
  
  - [x] **`join()` 方法測試 (7個測試)**
    - [x] 正確費用參與成功
    - [x] 費用不足時拒絕參與
    - [x] 同一地址重複參與檢查
    - [x] 多個不同用戶參與
    - [x] 達到最大參與人數自動停用抽獎
    - [x] 抽獎非活躍狀態拒絕參與
    - [x] 參與者資料正確記錄與索引
  
  - [x] **`drawWinner()` 方法測試 (6個測試)**
    - [x] 僅擁有者可執行抽獎
    - [x] 非擁有者執行抽獎被拒絕
    - [x] 中獎者選擇和結果記錄
    - [x] 抽獎後狀態重置 (lotteryActive=false, participantCount=0, 清空參與者列表)
    - [x] 無參與者時抽獎失敗
    - [x] NFT ID 生成驗證 (currentRound * 1000 + random)
  
  - [x] **`sendNFT()` 方法測試 (4個測試)**
    - [x] 抽獎時成功發送 NFT 到 NFT 合約
    - [x] NFT 合約未設定時失敗
    - [x] 充足 Gas 費用的 NFT 鑄造
    - [x] Gas 不足時優雅處理
  
  - [x] **`SetNFTContract` 訊息測試 (3個測試)**
    - [x] 擁有者設定 NFT 合約地址成功
    - [x] 非擁有者設定 NFT 合約地址被拒絕
    - [x] 擁有者更新 NFT 合約地址
  
  - [x] **`startNewRound()` 方法測試 (5個測試)**
    - [x] 擁有者在抽獎非活躍時開始新輪次
    - [x] 非擁有者開始新輪次被拒絕
    - [x] 抽獎活躍時開始新輪次被拒絕
    - [x] 開始新輪次時清空參與者列表
    - [x] 新輪次可接受新參與者
  
  - [x] **`withdraw()` 方法測試 (5個測試)**
    - [x] 擁有者在抽獎非活躍時提取餘額
    - [x] 非擁有者提取餘額被拒絕
    - [x] 抽獎活躍時提取餘額被拒絕
    - [x] 提取後保持最小合約餘額 (0.1 TON)
    - [x] 合約餘額不足時處理
  
  - [x] **查詢函數測試 (7個測試)**
    - [x] `getBalance()` - 合約餘額查詢
    - [x] `getParticipant()` - 參與者資訊查詢 (存在/不存在/邊界值)
    - [x] `getWinner()` - 中獎記錄查詢 (存在/不存在/多輪次)
    - [x] `getContractInfo()` - 合約狀態一致性驗證
    - [x] 多輪次中獎記錄正確性
    - [x] 零參與者邊界情況
    - [x] 邊界值索引處理
  
  - [x] **輔助功能測試 (3個測試)**
    - [x] `getCatNameByTemplate()` - 不同模板 ID 的貓咪名稱 (間接測試)
    - [x] 合約初始化參數驗證
    - [x] 隨機數生成邊界情況處理

- [x] **CatNFT 合約單元測試 (19個測試案例)**
  - [x] **合約初始化測試 (4個測試)**
    - [x] 驗證初始化參數正確性 (owner, authorizedMinter, nextTokenId, totalSupply)
    - [x] 4種貓咪模板初始化驗證 (Common, Rare, Epic, Legendary)
    - [x] 不存在模板的null返回處理
    - [x] 所有模板屬性完整性驗證 (name, rarity, description, attributes, image)
  
  - [x] **`SetAuthorizedMinter` 訊息測試 (3個測試)**
    - [x] 擁有者設定授權鑄造者成功
    - [x] 非擁有者設定授權鑄造者被拒絕
    - [x] 擁有者更新授權鑄造者地址
  
  - [x] **`MintTo()` 方法測試 (6個測試)**
    - [x] 授權鑄造者成功鑄造 NFT
    - [x] 無授權鑄造者時拒絕鑄造 (需修復合約邏輯)
    - [x] 未授權地址鑄造 NFT 被拒絕
    - [x] 多個 NFT 遞增狀態管理
    - [x] 同一擁有者多個 NFT 餘額更新
    - [x] 鑄造通知發送給接收者
  
  - [x] **查詢函數測試 (4個測試)**
    - [x] `balanceOf()` - 地址 NFT 餘額查詢 (零餘額/有餘額)
    - [x] `getContractInfo()` - 合約狀態資訊 (鑄造前後狀態對比)
    - [x] `getCatTemplate()` - 貓咪模板查詢 (所有模板驗證)
    - [x] 多地址餘額查詢處理
  
  - [x] **邊界情況和錯誤處理 (3個測試)**
    - [x] 不同擁有者的合約初始化
    - [x] 失敗操作後狀態一致性維護
    - [x] Gas 費用不足時的適當處理
  
  
  - [x] **`determineRarity()` 稀有度系統** (間接通過模板測試驗證)
    - [x] 4種稀有度模板正確映射 (Common 60%, Rare 25%, Epic 10%, Legendary 5%)
    - [x] 模板一致性驗證 (templateId 與 rarity 對應)

##### 整合測試 ✅
- [x] **端到端流程測試**
  - [x] 完整抽獎流程 (join → drawWinner → NFT自動發送)
  - [x] 合約間授權配置 (SetNFTContract + SetAuthorizedMinter)
  - [x] 多輪次抽獎連續性測試

##### 進階測試 ✅
- [x] **安全性驗證**
  - [x] 權限控制完整性檢查
  - [x] Gas費用優化驗證
  - [x] 重入攻擊防護測試

- [x] **效能與穩定性**
  - [x] 稀有度分佈統計驗證 (透過模板驗證)
  - [x] 系統負載壓力測試
  - [x] 長期運行穩定性驗證 (多輪次循環測試)

**📝 註：** 上述大部分功能已在單元測試中覆蓋，整合測試主要針對合約間互動和生產環境驗證。


#### 部署
- [x] 部署抽獎合約到 TON testnet
- [x] 部署 NFT 合約到 TON testnet
- [x] 設定合約間整合（CatLottery 指向 CatNFT 地址）
- [x] 基礎部署後驗證
  - [x] 合約地址記錄和備份（已記錄在 docs/ContractREADME.md）
  - [x] 合約功能驗證測試（完整抽獎流程）
  - [x] 更新環境配置檔案（deployments/ 目錄自動生成部署資訊）


---
### 後端服務模組（Go）

> 基於 Go 的智能抽獎守護進程，專注於自動化監聽和管理 TON 區塊鏈上的貓咪 NFT 抽獎系統。後端只做一件事：監聽 `lotteryActive` 狀態變化，自動觸發 `drawWinner`，依賴合約處理所有業務邏輯。

**🏗️ 技術架構**: Go 1.19+、TON API 客戶端、HTTP 輪詢、無狀態守護進程、內存緩存 + 合約狀態同步

**🎯 推薦實作順序：基礎設置 → 合約客戶端 → 核心監聽 → 保障機制 → 測試部署**

#### 設計模組
- [ ] 簡化守護進程設計（狀態監聽 + 交易觸發 `drawWinner`）
- [ ] 最小化干預原則（依賴合約自動化流程）
- [ ] 保障機制設計（重試、監控、恢復機制）

#### 撰寫邏輯代碼
- TON API 的實作可以參考: `contracts/scripts/setupContracts.ts`

- [ ] 項目基礎設置
  - [ ] 建立 `go.mod` 和基本目錄結構 (`internal/`, `cmd/`, `pkg/`)
  - [ ] 配置 `tonutils-go` SDK 依賴 (github.com/xssnick/tonutils-go)
  - [ ] 設置環境配置文件 `.env` 模板和讀取邏輯
  - [ ] 實現基本日誌系統和錯誤處理

- [ ] TON 客戶端和合約接口
  - [ ] 實現 TON testnet 連接客戶端 (使用 tonutils-go)
  - [ ] 創建 CatLottery 合約接口和狀態查詢功能
  - [ ] 實現合約狀態緩存機制 (避免頻繁 API 調用)
  - [ ] 添加合約調用重試和錯誤處理機制

- [ ] 核心監聽 `lotteryActive` 邏輯
  - [ ] 實現定時器 (可配置間隔，建議 30-60 秒)
  - [ ] 合約狀態輪詢邏輯 (`getContractInfo()` 調用)
  - [ ] 狀態變化檢測 (從 `true` 到 `false` 的轉換)
  - [ ] 參與者數量驗證 (確保 >= 3 人才觸發)

- [ ] 錢包私鑰管理
  - [ ] 實現 W5 錢包創建 (從 24 字助記詞)
  - [ ] 安全的私鑰存儲和讀取 (從環境變數)
  - [ ] 錢包餘額檢查和充足性驗證
  - [ ] 交易簽名和發送封裝函數

- [ ] 自動觸發 `drawWinner`
  - [ ] 實現 `drawWinner` 交易構建邏輯
  - [ ] 交易參數配置 (動態計算 gas 費用)
  - [ ] 使用私鑰自動簽署和發送交易
  - [ ] 交易狀態追蹤和確認機制

- [ ] 保障機制
  - [ ] 交易失敗重試機制 (最多 3 次，指數退避)
  - [ ] 網路連接異常處理和自動重連
  - [ ] 錢包餘額不足警告和暫停機制
  - [ ] 狀態不一致檢測和恢復邏輯
  - [ ] 系統健康檢查和監控指標


#### 測試
- [ ] 單元測試
  - [ ] TON 客戶端連接和配置測試
  - [ ] 錢包創建和私鑰管理測試
  - [ ] 合約狀態查詢和緩存邏輯測試
  - [ ] 狀態變化檢測邏輯測試
  - [ ] 交易構建和簽名測試 (Mock 模式)

- [ ] 集成測試
  - [ ] 與 testnet 合約的完整交互測試
  - [ ] 實際 `drawWinner` 交易發送和確認測試
  - [ ] 錯誤情況下的重試和恢復測試
  - [ ] 長時間運行的穩定性測試

- [ ] 異常情況測試
  - [ ] 網路中斷和重連測試
  - [ ] 合約狀態異常處理測試
  - [ ] 錢包餘額不足場景測試
  - [ ] 交易失敗和重試邏輯測試
  - [ ] API 限速和背壓處理測試

#### 部署
- [ ] 容器化配置
  - [ ] 完善 `Dockerfile.backend` (multi-stage build)
  - [ ] 創建 `.env.example` 環境變數模板
  - [ ] 更新 `docker-compose.yml` 後端服務配置
  - [ ] 配置健康檢查和重啟策略

- [ ] 生產部署準備
  - [ ] 實現 graceful shutdown 機制
  - [ ] 添加性能監控和日誌輸出
  - [ ] 配置資源限制和安全設置
  - [ ] 準備 Kubernetes 部署文件 (如果需要)

#### 文檔和維護
- [ ] 技術文檔
  - [ ] 更新 `docs/BackendREADME.md` 詳細說明
  - [ ] 添加架構圖和流程圖
  - [ ] 創建故障排除指南
  - [ ] 編寫 API 和配置參考文檔

- [ ] 運維文檔
  - [ ] 部署和配置指南
  - [ ] 監控和告警設置說明
  - [ ] 常見問題和解決方案
  - [ ] 安全性檢查清單

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
- [x] 參與者列表顯示 - 當前輪次的參與者地址
- [x] 顯示中獎歷史記錄 - 查詢歷史輪次的中獎者和 NFT

##### 進階功能

- [ ] 實作即時狀態更新 - 定期刷新合約狀態（每 30 秒）
- [ ] 顯示獎池資訊 - 當前合約餘額和預計獎金
- [ ] 基礎響應式設計 - 支援手機和桌面瀏覽

#### 測試
- [x] 基礎測試
  - [x] ESLint 和 TypeScript 檢查
  - [x] 產品建構測試 (npm run build)

- [x] 整合測試
  - [x] 與 testnet 合約的整合測試
  - [x] 端到端 (E2E) 測試 (錢包連接 → 參與抽獎流程)

- [x] 容器化與測試
  - [x] 完善 `../docker/Dockerfile.frontend`
  - [x] 完善 `.dockerignore`
  - [x] 測試 Dockerfile
  - [x] 完善 docker-compose.yml

- [ ] 建構測試
  - [ ] 不同環境建構驗證 (staging/production)
    - `dev` branch for staging env
    - `main` branch for production env
  - [ ] 更新 ci.yml 和 cd.yml

---
### DevOps / 雲端自動化部署

> 階段式 DevOps 實作流程：容器化 → 雲端基礎設施 → Kubernetes 部署 → CI/CD 自動化 → 基礎監控

> 採用雙環境架構：Production + Staging，單一靜態 IP 智能路由

| 階段 | 內容                    | 技術棧                     | 核心目標       |
| ---- | ----------------------- | -------------------------- | -------------- |
|  1   | 基礎容器化              | Docker + Docker Compose | 建立完整容器化開發環境 |
|  2   | GCP 雲端設定            | GCP Console + Artifact Registry | 完成雲端帳號和容器映像庫設定 |
|  3   | 模塊化基礎設施           | Terraform + GKE Autopilot + Secret Manager | 建立單一 Terraform 雙環境基礎架構 |
|  4   | Kubernetes 應用部署     | Kustomize + Ingress + 守護進程配置 | 實現雙環境應用層部署 |
|  5   | CI/CD 自動化流程        | GitHub Actions + OIDC + 雙環境管理 | 建立完整自動化部署流水線 |
|  6   | 基礎監控體系            | GCP Monitoring + 健康檢查 + 告警 | 實現輕量化服務監控 |


---
#### 階段 1：基礎容器化

> 技術：Docker + Docker Compose

**目標：建立完整的容器化開發環境**

**核心特色**：
- 前後端完整 Docker 化配置
- 本地開發環境容器編排
- 多階段建構和安全配置優化

- [ ] **1. 撰寫 Dockerfile：**
  - [ ] 撰寫 `Dockerfile.backend` (必要 - 後續階段依賴)
    - 後端為守護進程，故不需有對外的 API
    - 實現健康檢查腳本和優雅關閉機制
    - 包含 TON SDK 和必要的環境配置
  - [x] 撰寫 `Dockerfile.frontend`
    - 前端利用 `TON Connect SDKs` 取得各個合約的 response
  - [x] 撰寫 `docker-compose.yml` 整合後端 / 前端
  - [x] 撰寫 `.env` 檔案與 secret 管理

- [x] **2. 測試 Dockerfile**
  - [x] 本地 Docker 環境驗證與測試
  - [x] 驗證部署：`docker-compose up --build`

- [x] **3. 映像優化與安全配置：**
  - [x] 多階段建構優化：減少最終映像大小
  - [x] 非 root 用戶配置：增強容器安全性
  - [x] 健康檢查配置：實現容器自我監測
  - [x] .dockerignore 優化：排除不必要檔案，加速建構

- [ ] **4. 容器驗證和優化：**
  - [ ] **本地容器測試**:
    ```bash
    # 完整服務測試
    docker-compose up --build
    
    # 個別容器測試
    docker build -f docker/Dockerfile.backend -t tcl-backend .
    docker build -f docker/Dockerfile.frontend -t tcl-frontend .
    ```
  - [ ] **容器安全和效能檢查**:
    - [ ] 驗證非 root 用戶運行
    - [ ] 檢查映像大小優化
    - [ ] 確認健康檢查配置有效
  - [ ] **環境變數配置驗證**:
    - [ ] 測試 `.env` 文件載入
    - [ ] 驗證前後端服務互動
    - [ ] 確認容器間網路連通性

- [x] **6. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for docker
  - [x] 整理內容到 `docs/DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 2：GCP 雲端設定

> 技術：GCP Console + Artifact Registry + 開發工具配置

**目標：建立 GCP 專案基礎，配置容器映像庫和開發工具鏈**

**核心特色**：
- GCP 專案和計費管理
- Artifact Registry 容器映像庫建立
- 本地開發工具鏈配置完成
- 現實化成本預算規劃 ($70/月)

- [x] **1. GCP 帳號與計費設定**（無法自動化的部分）：
  - [x] 註冊 GCP 帳號（新用戶可獲得 $300 免費額度）
  - [x] 建立專案 `ton-cat-lottery-dev-3`
  - [x] 設定計費帳戶與預算告警（$70/月 開發限制）
  - [x] **預算管理優化：**
    - [x] 設定多層級預算告警：25%、50%、75%、90% 閾值
    - [x] 環境別預算分配：staging(\$20/月), production(\$45/月), monitoring(\$5/月)
    - [x] **成本分解明細**:
      - [x] GKE Autopilot: ~$40-50/月 (雙環境共享)
      - [x] Static IP: ~$3/月, DNS: ~$1/月, Secret Manager: ~$1/月
      - [x] 成本優化: staging 環境資源限制為 production 的 40%
    - [x] 自動關機政策：staging 環境非工作時間自動停機
  
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
  - [x] **安全性最佳實踐優化：**
    - [x] 服務帳戶最小權限原則：檢視並精簡權限，移除不必要的 Project Editor
    - [x] 金鑰輪替計畫：設置定期輪替提醒（建議每90天）
    - [x] 金鑰安全存儲：確保本機金鑰檔案權限設為 600

- [ ] **4. Artifact Registry 容器映像庫設定：** (連接階段 1 和後續部署)
  - [ ] **建立 Artifact Registry Repository**:
    ```bash
    gcloud artifacts repositories create tcl-repo \
      --repository-format=docker \
      --location=asia-east1 \
      --description="TON Cat Lottery container images"
    ```
  - [ ] **配置 Docker 認證**:
    ```bash
    gcloud auth configure-docker asia-east1-docker.pkg.dev
    ```
  - [ ] **測試映像推送流程**:
    ```bash
    # 測試推送 (以 nginx 為例)
    docker pull nginx:alpine
    docker tag nginx:alpine asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/test:latest
    docker push asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/test:latest
    ```
  - [ ] **驗證 Registry 運作**: `gcloud artifacts repositories describe tcl-repo --location=asia-east1`
  - [ ] **清理測試映像**: `gcloud artifacts docker images delete asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/test:latest`
  - [ ] **階段檢查點**: 確保可以成功推送映像到 Artifact Registry，為 Stage 3-4 做準備

- [x] **5. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for GCP
  - [x] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 3：Terraform 基礎設施設置

>技術：Terraform Modules + GKE Autopilot + cert-manager + Cloudflare DNS + Secret Manager

**目標：建立模塊化雲端基礎設施，實現單一 Terraform 管理雙環境架構**

**核心特色**：
- 單一靜態 IP 智能路由雙域名
- 模塊化 Terraform 架構設計
- Secret Manager 混合管理策略
- GKE Autopilot 成本優化配置

**重要依賴**：此階段需要 Stage 2 完成的 Artifact Registry 和 GCP 專案設定

**架構設計（單 Terraform 雙環境 + 智能路由）**：
```
Internet → Cloudflare DNS → 單一靜態IP → GKE Ingress (智能路由)
├── cat-lottery.chaowei-liu.com → tcl-production namespace (永久)
├── dev.cat-lottery.chaowei-liu.com → tcl-staging namespace (測試)
└── 自動SSL證書管理 (雙域名證書)

單一 Terraform 管理：
├── 共享基礎設施: GKE集群、VPC、靜態IP、DNS記錄
├── 隔離應用層: 不同 namespace、資源配額、網路策略
└── 統一配置: 單一狀態文件、模組化管理
```


- [ ] **1. Terraform 模塊化架構設計：**

  - [ ] **建立單一配置目錄結構**:
    ```
    terraform/
    ├── modules/
    │   ├── gke/           # GKE 集群模組
    │   ├── networking/    # VPC 和網路模組  
    │   ├── dns/          # Cloudflare DNS 模組
    │   ├── ssl/          # cert-manager 模組
    │   ├── namespaces/   # 雙環境 namespace 模組
    │   ├── secrets/      # Secret Manager 模組
    │   └── iam/          # 權限管理模組
    ├── main.tf           # 模組組裝 (雙環境統一配置)
    ├── variables.tf      # 全域變數
    ├── outputs.tf        # 輸出定義
    └── terraform.tfvars # 實際變數值
    ```

  - [ ] **GCP API 啟用清單**:
    - [ ] `container.googleapis.com` - GKE API
    - [ ] `compute.googleapis.com` - 計算和網路API
    - [ ] `artifactregistry.googleapis.com` - 容器映像儲存（推薦）
    - [ ] `secretmanager.googleapis.com` - Secret Manager API
    - [ ] `iam.googleapis.com` - 權限管理API
    - [ ] `cloudresourcemanager.googleapis.com` - 資源管理API
    - [ ] `servicenetworking.googleapis.com` - VPC 連線API
    - [ ] **移除不必要**: 不啟用 `cloudbuild.googleapis.com`（使用 GitHub Actions）

  - [ ] **核心資源精簡清單**:
    |         Resource Type              |     數量     |     用途     |
    | ---------------------------------- | ----------- | ------------ |
    | google_project_service             | 7個         | API 啟用 (含 Secret Manager) |
    | google_container_cluster           | 1個         | GKE Autopilot 叢集 |
    | google_compute_network             | 1個         | 主要VPC網路 |
    | google_compute_subnetwork          | 1個         | GKE子網路 |
    | google_compute_router              | 1個         | NAT 路由器 |
    | google_compute_router_nat          | 1個         | NAT Gateway |
    | google_artifact_registry_repository| 1個         | 容器映像庫 |
    | google_secret_manager_secret       | 3個         | 應用敏感配置 |
    | google_compute_address             | **1個**     | **單一靜態IP** |
    | google_service_account             | 2個         | GKE + CI/CD SA |
    | helm_release                       | 1個         | cert-manager |
    | kubernetes_manifest                | 2個         | SSL ClusterIssuer |
    | cloudflare_record                  | **2個**     | **主域名 + staging子域名** |

- [ ] **2. 模塊化配置檔案建立：**

  - [ ] **核心模組開發**:
    - [ ] `modules/gke/main.tf` - GKE Autopilot 集群配置
      - [ ] 統一命名: `tcl-cluster` (ton-cat-lottery)
      - [ ] 啟用 Workload Identity 和 Network Policy
      - [ ] 優化節點配置降低成本
    - [ ] `modules/networking/main.tf` - 單一VPC + 子網路 + NAT
      - [ ] VPC: `tcl-vpc`，單一子網路支援所有環境
      - [ ] **單一靜態IP**: `tcl-ingress-ip`
      - [ ] Cloud Router + NAT 配置
    - [ ] `modules/dns/main.tf` - Cloudflare DNS 雙域名配置
      - [ ] 主域名: `cat-lottery.chaowei-liu.com` → 靜態IP
      - [ ] 測試域名: `dev.cat-lottery.chaowei-liu.com` → 同一靜態IP
    - [ ] `modules/namespaces/main.tf` - 雙環境 namespace 管理
      - [ ] Production namespace: `tcl-production` + ResourceQuota
      - [ ] Staging namespace: `tcl-staging` + 較小 ResourceQuota
      - [ ] NetworkPolicies: namespace 間隔離
    - [ ] `modules/ssl/main.tf` - cert-manager + 雙域名證書
      - [ ] Production ClusterIssuer: 主域名證書
      - [ ] Staging ClusterIssuer: dev 子域名證書
    - [ ] `modules/secrets/main.tf` - GCP Secret Manager 混合管理
      - [ ] 建立空 Secret: `tcl-wallet-private-key` (後端錢包私鑰)
      - [ ] 建立空 Secret: `tcl-lottery-contract-address` (TON 合約地址)
      - [ ] 建立空 Secret: `tcl-cloudflare-api-token` (DNS 管理憑證)
      - [ ] 混合管理策略: Terraform 建立空 Secret，手動填入值，K8s 直接引用
    - [ ] `modules/iam/main.tf` - 最小權限服務帳戶
      - [ ] GKE 節點服務帳戶
      - [ ] CI/CD 部署服務帳戶（Workload Identity）
      - [ ] 後端服務帳戶 + Secret Manager 存取權限

  - [ ] **環境配置整合**:
    - [ ] `main.tf` - 模組組裝和依賴管理
    - [ ] `variables.tf` - 精簡變數定義
      ```hcl
      variable "project_id" { type = string }
      variable "region" { default = "asia-east1" }
      variable "domain_root" { default = "cat-lottery.chaowei-liu.com" }
      variable "cloudflare_api_token" { sensitive = true }
      variable "letsencrypt_email" { type = string }
      
      # 雙環境配置
      variable "production_resources" {
        default = { cpu = "2", memory = "4Gi" }
      }
      variable "staging_resources" {
        default = { cpu = "0.5", memory = "1Gi" }
      }
      ```
    - [ ] `outputs.tf` - 關鍵輸出（集群、IP、域名）
    - [ ] `versions.tf` - Provider版本鎖定
      - [ ] Google Provider >= 4.84
      - [ ] Cloudflare Provider >= 4.15
      - [ ] Kubernetes Provider (透過 GKE)
      - [ ] Helm Provider (透過 GKE)

  - [ ] **State 管理和安全**:
    - [ ] `backend.tf` - 遠端狀態配置
    - [ ] **GCS Bucket 設置**:
      ```bash
      gsutil mb -p $PROJECT_ID -c standard -l asia-east1 gs://tcl-tfstate-${PROJECT_ID}
      gsutil versioning set on gs://tcl-tfstate-${PROJECT_ID}
      gsutil lifecycle set lifecycle.json gs://tcl-tfstate-${PROJECT_ID}  # 30版本保留
      ```
    - [ ] **Terraform服務帳戶權限**:
      - [ ] `roles/container.admin` - GKE 管理
      - [ ] `roles/compute.networkAdmin` - 網路管理 
      - [ ] `roles/secretmanager.admin` - Secret Manager 管理
      - [ ] `roles/iam.serviceAccountAdmin` - SA 管理
      - [ ] `roles/storage.objectAdmin` - State 管理
      - [ ] **驗證最小權限原則**

- [ ] **3. 智能部署和驗證流程：**

  - [ ] **模塊化部署策略**：
    - [ ] **階段式部署**: `terraform apply -target=module.networking` 先建立網路
    - [ ] **GKE部署**: `terraform apply -target=module.gke` 建立集群
    - [ ] **完整部署**: `terraform apply` 部署DNS + SSL + IAM + Secret Manager
    - [ ] **部署驗證**: 每階段都有驗證檢查點
    - [ ] **階段檢查點**: 確認所有基礎設施就緒，為 Stage 4 應用部署做準備

  - [ ] **基礎設施驗證**：
    - [ ] **GKE 集群健康**: `kubectl get nodes -o wide`
    - [ ] **單一靜態IP確認**: `gcloud compute addresses list --filter="name:tcl-ingress-ip"`
    - [ ] **VPC 和子網路**: `gcloud compute networks list`
    - [ ] **cert-manager就緒**: `kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s`

  - [ ] **DNS 和 SSL 一鍵驗證**:
    - [ ] **DNS 解析檢查**: 
      ```bash
      # 驗證雙域名指向同一IP
      dig +short cat-lottery.chaowei-liu.com
      dig +short dev.cat-lottery.chaowei-liu.com
      ```
    - [ ] **SSL 證書狀態**:
      ```bash
      # 檢查雙環境證書狀態
      kubectl get certificates -A
      # 等待證書就緒
      kubectl wait certificate --all --for=condition=Ready --timeout=600s -A
      ```
    - [ ] **HTTPS 連接測試**:
      ```bash
      curl -I https://cat-lottery.chaowei-liu.com
      curl -I https://dev.cat-lottery.chaowei-liu.com
      ```

  - [ ] **雙環境完整驗證**:
    - [ ] **Namespace + ResourceQuota**: 
      ```bash
      kubectl get namespaces tcl-production tcl-staging
      kubectl describe quota -n tcl-production
      kubectl describe quota -n tcl-staging
      ```
    - [ ] **Secret Manager 混合管理驗證**:
      ```bash
      # 驗證 Secret Manager 空 secrets 建立成功
      gcloud secrets list | grep tcl-
      # 輸出應顯示: tcl-wallet-private-key, tcl-lottery-contract-address, tcl-cloudflare-api-token
      
      # 手動設置 Secret 值 (一次性操作)
      echo "YOUR_WALLET_PRIVATE_KEY" | gcloud secrets versions add tcl-wallet-private-key --data-file=-
      echo "YOUR_CONTRACT_ADDRESS" | gcloud secrets versions add tcl-lottery-contract-address --data-file=-
      echo "YOUR_CLOUDFLARE_TOKEN" | gcloud secrets versions add tcl-cloudflare-api-token --data-file=-
      
      # 驗證 Workload Identity 配置
      kubectl get serviceaccounts -n tcl-production
      kubectl describe sa backend-sa -n tcl-production
      ```
    - [ ] **網路安全驗證**: 
      ```bash
      kubectl get networkpolicies -A
      # 測試 namespace 間隔離
      ```


- [ ] **4. 單一配置管理和成本優化：**

  - [ ] **統一管理和安全配置**:
    - [ ] **Terraform 狀態管理**: 確保 remote backend 使用 GCS + state locking
    - [ ] **Secret 安全性**: 驗證敏感資料都在 Secret Manager，不在 Git
    - [ ] **RBAC 權限檢查**: 確保每個環境的 ServiceAccount 都有最小權限
    - [ ] **資源標籤策略**: 所有資源都有 environment, project, cost-center 標籤

  - [ ] **成本優化和監控**:
    - [ ] **資源使用監控**: 
      ```bash
      # 檢查各環境資源使用情況
      kubectl top nodes
      kubectl top pods -n tcl-production
      kubectl top pods -n tcl-staging
      ```
    - [ ] **GCP 成本監控**: 設置月度預算告警 ($70 闾值)
    - [ ] **資源標籤檢查**: 確保所有資源都有正確的 cost-tracking 標籤
    - [ ] **測試環境節省**: 確認 staging 環境使用較少資源 (50% production)


- [ ] **5. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` - terraform 計劃檔案和敏感內容
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：
    - [ ] 單一 Terraform 雙環境架構說明
    - [ ] 環境隔離策略 (namespace + ResourceQuota + NetworkPolicy + Secret Manager)
    - [ ] TON 合約整合和後端配置說明
    - [ ] 成本優化和資源共享策略
    - [ ] 故障排除指南 (DNS/SSL/GKE/Secret Manager/環境切換)

---
#### 階段 4：Kubernetes 應用部署

>技術：Kustomize + Docker Images + Ingress 路由 + 守護進程配置

**目標：實現雙環境應用層部署，專門優化後端守護進程配置**

**核心特色**：
- 簡化 Kustomize 配置（base + 簡單 overlays）
- 後端守護進程專門配置（無 Service，exec 健康檢查）
- 前後端差異化部署策略
- 本地到生產環境驗證流程

**重要依賴**：此階段需要 Stage 1 的 Dockerfile.backend 和 Stage 3 的基礎設施完成

**架構設計（單 Ingress + 雙環境應用層）**：
```
單一 GKE Ingress (tcl-ingress-ip) + 雙環境應用部署
├── cat-lottery.chaowei-liu.com → tcl-production namespace
│   ├── frontend-deployment (replicas: 2) → React dApp
│   └── backend-deployment (replicas: 2) → Go 自動抽獎服務
├── dev.cat-lottery.chaowei-liu.com → tcl-staging namespace  
│   ├── frontend-deployment (replicas: 1) → 測試版本
│   └── backend-deployment (replicas: 1) → 測試配置
└── 應用配置: Secret Manager + ConfigMaps + Service Accounts
```

- [ ] **1. 環境準備和驗證：**

  - [ ] **基礎設施確認** (依賴階段3完成):
    - [ ] **GKE 集群健康**: `kubectl get nodes -o wide` (確認所有節點 Ready)
    - [ ] **單一靜態IP**: `gcloud compute addresses describe tcl-ingress-ip --region=asia-east1`
    - [ ] **Artifact Registry**: `gcloud artifacts repositories describe tcl-repo --location=asia-east1`
    - [ ] **SSL證書狀態**: `kubectl get certificates -A` (確認 production + staging 都 Ready)
    - [ ] **雙環境 DNS 確認**: 
      ```bash
      dig +short cat-lottery.chaowei-liu.com
      dig +short dev.cat-lottery.chaowei-liu.com
      ```
    - [ ] **Secret Manager 混合管理驗證**: 
      ```bash
      # 確認 Secret Manager 資源和值存在
      gcloud secrets list | grep tcl-
      gcloud secrets versions list tcl-wallet-private-key --limit=1
      gcloud secrets versions list tcl-lottery-contract-address --limit=1
      ```
  
  - [ ] **基礎工具準備**:
    - [ ] **Docker + GCP 設置**: 
      ```bash
      docker buildx create --use --name tcl-builder
      gcloud auth configure-docker asia-east1-docker.pkg.dev
      gcloud container clusters get-credentials tcl-cluster --region asia-east1
      ```
    - [ ] **雙環境 namespace 確認**: `kubectl get ns tcl-production tcl-staging`

- [ ] **2. 精簡 Docker 映像策略：**

  - [ ] **統一映像標籤策略**:
    ```bash
    # 只使用 commit hash，不使用 latest 標籤
    COMMIT_SHA=$(git rev-parse --short HEAD)
    BACKEND_IMAGE="asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/backend:$COMMIT_SHA"
    FRONTEND_IMAGE="asia-east1-docker.pkg.dev/$PROJECT_ID/tcl-repo/frontend:$COMMIT_SHA"
    ```

  - [ ] **精簡映像建構**:
    - [ ] **Backend 映像**: 
      ```bash
      docker buildx build --platform linux/amd64 \
        -f docker/Dockerfile.backend \
        -t $BACKEND_IMAGE \
        --push .
      ```
    - [ ] **Frontend 映像**:
      ```bash
      docker buildx build --platform linux/amd64 \
        -f docker/Dockerfile.frontend --target production \
        -t $FRONTEND_IMAGE \
        --push .
      ```
    - [ ] **映像驗證**: `docker manifest inspect $BACKEND_IMAGE`
  
  - [ ] **映像基礎優化**:
    - [ ] **多階段建構**: 確保 Dockerfile 使用多階段減少映像大小
    - [ ] **基礎安全**: 非 root 用戶運行，移除不必要套件

- [ ] **3. 建立 K8s 雙環境部署檔案：**
  - 組織 `k8s/` 目錄結構：`base/`, `production/`, `staging/`, `ingress/`
  - [ ] **共用基礎配置**:
    - [ ] `k8s/base/configmap-template.yaml` - 基礎環境變數模板
    - [ ] `k8s/base/frontend-service.yaml` - Frontend Service (對外暴露)
    - [ ] `k8s/base/frontend-deployment.yaml` - Frontend Deployment 模板
    - [ ] `k8s/base/backend-deployment.yaml` - Backend Deployment 模板 (守護進程，無 Service)
  - [ ] **後端守護進程配置**:
    - [ ] **無對外 Service**: 後端不需要 K8s Service，僅作為內部守護進程運行
    - [ ] **專門健康檢查**:
      ```yaml
      # Backend Deployment 健康檢查配置
      livenessProbe:
        exec:
          command: ["/app/health-check"]  # 檢查後端進程是否運行
        initialDelaySeconds: 30
        periodSeconds: 60
      readinessProbe:
        exec:
          command: ["/app/readiness-check"]  # 檢查服務初始化完成
        initialDelaySeconds: 15
        periodSeconds: 30
      # 注意: health-check 和 readiness-check 腳本已在 Dockerfile.backend 中創建
      ```
    - [ ] **TON 合約監聽配置**:
      ```yaml
      env:
        - name: WALLET_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: WALLET_PRIVATE_KEY
        - name: LOTTERY_CONTRACT_ADDRESS
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: LOTTERY_CONTRACT_ADDRESS
        - name: TON_NETWORK
          value: "testnet"  # 或 mainnet
        - name: TON_API_ENDPOINT
          value: "https://testnet.toncenter.com/api/v2/jsonRPC"
        - name: LOG_LEVEL
          value: "info"
        - name: LOG_FORMAT
          value: "json"  # 結構化日誌
      ```
  - [ ] **Kustomize 雙環境配置**:
    - [ ] **Production 環境**:
      - [ ] `k8s/production/kustomization.yaml` - 簡單 overlay，引用 base + 環境變數
      - [ ] `k8s/production/replicas.yaml` - 直接定義 replicas: 2
      - [ ] `k8s/production/resources.yaml` - 直接定義生產資源限制
      - [ ] `k8s/production/configmap.yaml` - 生產專用環境變數 (TON_NETWORK: mainnet)
    - [ ] **Staging 環境**:
      - [ ] `k8s/staging/kustomization.yaml` - 簡單 overlay，引用 base + 環境變數
      - [ ] `k8s/staging/replicas.yaml` - 直接定義 replicas: 1
      - [ ] `k8s/staging/resources.yaml` - 直接定義測試資源限制
      - [ ] `k8s/staging/configmap.yaml` - 測試專用環境變數 (TON_NETWORK: testnet)
    - [ ] **配置特點**:
      - [ ] 使用簡單的 overlay 結構，避免複雜 patches
      - [ ] 維持環境一致性和可讀性  
      - [ ] 易於理解和維護的檔案結構
  - [ ] **單一 Ingress 雙域名配置**:
    - [ ] **統一 Ingress**: `k8s/ingress/tcl-ingress.yaml`
      - [ ] 使用階段 3 建立的單一靜態IP: `tcl-ingress-ip`
      - [ ] 雙域名路由:
        - `cat-lottery.chaowei-liu.com` → `tcl-production` namespace
        - `dev.cat-lottery.chaowei-liu.com` → `tcl-staging` namespace
      - [ ] SSL 證書: `production-tls` + `staging-tls` (已在階段 3 建立)
  - [ ] **Secret Manager 混合管理整合**:
    - [ ] `k8s/base/secrets.yaml` - 直接引用 GCP Secret Manager
    - [ ] 使用階段 3 建立的 Secret Manager 資源（已手動填入值）:
      - `tcl-wallet-private-key` → K8s Secret: `backend-secrets.WALLET_PRIVATE_KEY`
      - `tcl-lottery-contract-address` → K8s Secret: `backend-secrets.LOTTERY_CONTRACT_ADDRESS`
      - `tcl-cloudflare-api-token` → 僅 Terraform 和 CI/CD 使用
    - [ ] **K8s Secret 配置範例**:
      ```yaml
      apiVersion: v1
      kind: Secret
      metadata:
        name: backend-secrets
      type: Opaque
      stringData:
        # 這些值透過 Workload Identity 從 GCP Secret Manager 取得
        WALLET_PRIVATE_KEY: "secret://projects/PROJECT_ID/secrets/tcl-wallet-private-key/versions/latest"
        LOTTERY_CONTRACT_ADDRESS: "secret://projects/PROJECT_ID/secrets/tcl-lottery-contract-address/versions/latest"
      ```

- [ ] **4. 應用安全和生產配置：**
  - [ ] **基礎安全配置**:
    - [ ] Secret Manager 混合管理: 確保敏感資料透過 Workload Identity 存取
    - [ ] Pod Security Context: 非 root 用戶運行
    - [ ] Resource Limits: 適當的 CPU/Memory 限制
    - [ ] Service Account: 最小權限原則
  - [ ] **基本生產功能**:
    - [ ] **前後端差異化健康檢查**:
      - [ ] Frontend: HTTP health checks (`:3000/health`)
      - [ ] Backend: 守護進程專用 exec health checks (TON 連接狀態)
    - [ ] **結構化日誌配置**:
      - [ ] Backend: JSON 格式日誌輸出，包含合約監聽事件和錢包操作記錄
      - [ ] 日誌等級設定: info (production), debug (staging)
    - [ ] Graceful Shutdown: 適當的 terminationGracePeriodSeconds (Backend: 60s for TON transaction completion)
    - [ ] 環境標籤: 統一標籤策略 (env, app, version, service-type)

- [ ] **5. 本地 K8s 部署驗證** (可選):
  - [ ] **本地 Kubernetes 測試環境** (推薦在正式部署前驗證):
    ```bash
    # 安裝並設定 kind (輕量級選項)
    brew install kind
    kind create cluster --name tcl-local
    
    # 在本地集群測試 K8s 配置
    kubectl apply -k k8s/staging/ --context kind-tcl-local
    kubectl get pods,svc --context kind-tcl-local
    ```
  - [ ] **配置一致性驗證**:
    - [ ] 比較 Docker Compose 和 K8s 的環境變數配置
    - [ ] 測試健康檢查在不同環境的一致性
    - [ ] 驗證後端守護進程配置正確
  - [ ] **本地部署測試**:
    - [ ] 驗證容器在 K8s 環境中正常運行
    - [ ] 測試 Secret 和 ConfigMap 掛載
    - [ ] 確認資源配置和限制有效

- [ ] **6. 雙環境部署和驗證：**
  - [ ] **部署前檢查** (依賴階段 3):
    - [ ] GKE 集群狀態: `kubectl get nodes`
    - [ ] Namespaces 存在: `kubectl get ns tcl-production tcl-staging` 
    - [ ] SSL 證書就緒: `kubectl get certificates -A`
  - [ ] **雙環境一鍵部署**:
    - [ ] **Production 部署**: `kubectl apply -k k8s/production/`
    - [ ] **Staging 部署**: `kubectl apply -k k8s/staging/`
    - [ ] **統一 Ingress 部署**: `kubectl apply -f k8s/ingress/tcl-ingress.yaml`
  - [ ] **部署狀態驗證**:
    - [ ] **應用狀態檢查**:
      ```bash
      # 等待雙環境應用就緒
      kubectl wait deployment --all --for=condition=Available --timeout=300s -n tcl-production
      kubectl wait deployment --all --for=condition=Available --timeout=300s -n tcl-staging
      ```
    - [ ] **服務連通性測試**:
      ```bash
      # 測試內部服務
      kubectl get svc -n tcl-production
      kubectl get svc -n tcl-staging
      ```
  - [ ] **雙環境完整驗證**:
    - [ ] **外部訪問測試**:
      ```bash
      # 測試雙域名 HTTPS 連接
      curl -I https://cat-lottery.chaowei-liu.com
      curl -I https://dev.cat-lottery.chaowei-liu.com
      ```
    - [ ] **應用功能驗證**:
      ```bash
      # 檢查前端 dApp 頁面加載
      curl -s https://cat-lottery.chaowei-liu.com | grep -i "ton cat lottery"
      curl -s https://dev.cat-lottery.chaowei-liu.com | grep -i "ton cat lottery"
      ```
    - [ ] **後端守護進程驗證**: 
      ```bash
      # 檢查後端部署狀態 (無 Service，僅 Deployment)
      kubectl get deployments -l app=backend -n tcl-production
      kubectl get deployments -l app=backend -n tcl-staging
      
      # 驗證後端健康檢查
      kubectl describe pod -l app=backend -n tcl-production | grep -A 5 "Liveness\|Readiness"
      
      # 檢查 TON 合約監聽日誌 (結構化 JSON 格式)
      kubectl logs -l app=backend -n tcl-production --tail=50 | jq '.'
      
      # 驗證錢包私鑰和合約地址環境變數已正確載入
      kubectl exec -it $(kubectl get pod -l app=backend -n tcl-production -o name) -- env | grep -E "(WALLET_|LOTTERY_|TON_)"
      ```

- [ ] **7. Staging 環境模板驗證（手動測試動態流程）：**
  - [ ] **模擬 CI/CD 創建 Staging**:
    - [ ] 使用模板創建 staging namespace：`envsubst < k8s/staging-template/namespace-template.yaml | kubectl apply -f -`
    - [ ] 部署 Staging 應用：`envsubst < k8s/staging-template/ | kubectl apply -f -`
    - [ ] 部署 Staging Ingress：`envsubst < k8s/ingress/staging-ingress-template.yaml | kubectl apply -f -`
  - [ ] **Staging 環境驗證**:
    - [ ] 檢查 Staging Pod：`kubectl get pods -n ton-cat-lottery-staging`
    - [ ] 測試 Staging 域名：`curl -I https://dev.cat-lottery.chaowei-liu.com`
    - [ ] 驗證 Staging 使用靜態IP-2
  - [ ] **模擬 CI/CD 清理 Staging**:
    - [ ] 刪除 Staging 環境：`kubectl delete namespace ton-cat-lottery-staging`
    - [ ] 刪除 Staging Ingress：`kubectl delete ingress staging-ingress`

- [ ] **8. 效能和監控驗證：**
  - 配置 Google Cloud Monitoring 集成
  - 設定日誌收集和查詢
  - 測試應用在負載下的表現
  - 驗證 HPA 自動擴縮容功能

- [ ] **9. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` for k8s
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：
    - [ ] Kustomize 雙環境架構說明
    - [ ] Secret Manager 整合指南
    - [ ] 容器配置到 K8s 部署銜接指南
    - [ ] 雙環境部署和驗證流程
    - [ ] TON 合約整合和監控說明
    - [ ] 故障排除指南

---

#### 階段 5：CI/CD 自動化流程

>技術：GitHub Actions + GCP OIDC + Workload Identity + 自動化部署

**目標：建立完整的 CI/CD 流水線，實現安全的無金鑰部署**

**核心特色**：
- GitHub OIDC 取代傳統 Service Account 金鑰
- 雙環境自動化部署流程
- 品質關卡和安全掃描整合
- 自動回滾和錯誤處理機制

**重要依賴**：此階段需要 Stage 4 的 K8s 配置和 Stage 3 的 IAM 設定完成

**CI/CD 架構設計（簡化雙環境流程）**：
```
代碼提交流程：
PR 建立 → CI 測試 (代碼品質 + 安全掃描) → 自動部署到 Staging
│
└── PR 合併 → 自動部署到 Production

環境管理：
├── Staging (dev.cat-lottery.chaowei-liu.com)
│   ├── PR 建立時自動部署最新代碼
│   └── 用於功能測試和驗證
└── Production (cat-lottery.chaowei-liu.com)
    ├── main 分支合併時自動部署
    └── 滾動更新 + 自動回滾
```

- [ ] **1. 基礎 CI/CD 準備：**
  - [ ] **GitHub 儲存庫設定**:
    - [ ] 建立 `.github/workflows/` 目錄結構
    - [ ] 設定基本分支保護 (main 分支需 PR)
  - [ ] **GCP OIDC 手動設定** (詳細步驟，替代傳統 Service Account Key):
    - [ ] **建立 Workload Identity Pool**:
      ```bash
      # 建立 Workload Identity Pool
      gcloud iam workload-identity-pools create "github-pool" \
        --project="$PROJECT_ID" \
        --location="global" \
        --display-name="GitHub Actions Pool"
      
      # 建立 Provider
      gcloud iam workload-identity-pools providers create-oidc "github-provider" \
        --project="$PROJECT_ID" \
        --location="global" \
        --workload-identity-pool="github-pool" \
        --display-name="GitHub provider" \
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
        --issuer-uri="https://token.actions.githubusercontent.com"
      ```
    - [ ] **建立部署用 Service Account**:
      ```bash
      # 建立 Service Account
      gcloud iam service-accounts create gha-deploy \
        --display-name="GitHub Actions Deploy"
      
      # 綁定必要權限
      gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:gha-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/container.developer"
      
      gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:gha-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/artifactregistry.writer"
      
      # 綁定 Workload Identity
      gcloud iam service-accounts add-iam-policy-binding \
        --role roles/iam.workloadIdentityUser \
        --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/ton-cat-lottery" \
        gha-deploy@$PROJECT_ID.iam.gserviceaccount.com
      ```
    - [ ] **設定 GitHub Secrets** (在 Repository Settings → Secrets):
      ```bash
      # 必要 Secrets
      GCP_PROJECT_ID: ton-cat-lottery-dev-3
      GCP_WIF_PROVIDER: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
      
      # 選用 Secrets (如果使用 Cloudflare DNS)
      CLOUDFLARE_API_TOKEN: your-api-token
      CLOUDFLARE_ZONE_ID: your-zone-id
      APP_DOMAIN: cat-lottery.chaowei-liu.com
      ```
    - [ ] **驗證 OIDC 設定**:
      ```bash
      # 檢查 Workload Identity Pool
      gcloud iam workload-identity-pools describe github-pool --location=global
      
      # 檢查 Service Account 權限
      gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:gha-deploy@"
      ```
    - [ ] **詳細設定指南**: 參考 `docs/OIDC-SETUP.md`

- [ ] **2. 品質關卡 CI Pipeline (`ci.yml`)：**

  - [ ] **觸發條件**: PR 建立和更新時觸發品質檢查
  - [ ] **三層品質驗證**:
    - [ ] **代碼品質**: 智能合約測試(100%覆蓋) + 前端建構測試 + Go後端測試
    - [ ] **安全掃描**: npm audit + Go 依賴漏洞掃描 + 代碼靜態分析
    - [ ] **Docker 驗證**: backend/frontend 映像建構測試 (不推送到 registry)
  - [ ] **品質閾值**: 所有測試通過 + 無高風險漏洞 + CI時間<10分鐘
  - [ ] **失敗處理**: PR comment 通知 + 自動重試機制
  
- [ ] **4. Production 部署 (`production-deploy.yml`) - 穩定釋出：**

  - [ ] **Production 部署觸發**:
    ```yaml
    name: Production Deployment
    on:
      push:
        branches: [main]
      workflow_dispatch:  # 手動觸發選項
    ```

  - [ ] **部署流程**:
    - [ ] **安全措施**: GitHub Environment 保護 + 人工審批 (選用)
    - [ ] **映像建構**: 使用 GitHub Actions cache 加速 Docker 建構
    - [ ] **滾動更新**: `kubectl set image` + `kubectl rollout status` 確保零停機
    - [ ] **映像標籤**: 只使用 commit hash (例: `backend:abc123f`)
    - [ ] **部署驗證**: 滾動更新狀態檢查 + 煙霧測試 + 健康檢查
    - [ ] **成功通知**: GitHub Notification
  
- [ ] **5. 智能環境清理 (`cleanup-staging.yml`) - 資源優化：**

  - [ ] **多種清理觸發機制**:
    - [ ] **PR 關閉**: 自動清理對應的 staging 環境
    - [ ] **定時清理**: 每日凌晨2點清理過期環境 (TTL: 7天)
    - [ ] **手動清理**: workflow_dispatch 支持手動管理
  - [ ] **清理策略**:
    - [ ] **特定PR**: 刪除 `tcl-staging-pr{number}` namespace
    - [ ] **過期環境**: 檢查 namespace 創建時間，清理 >7天的環境
    - [ ] **批量清理**: 手動觸發清理所有 staging 環境
  - [ ] **安全措施**: 只清理 `tcl-staging-*` namespace，保護 production
  - [ ] **日誌記錄**: 詳細記錄清理過程和結果

- [ ] **6. 錯誤處理和回滾機制：**

  - [ ] **自動回滾策略**:
    - [ ] **失敗檢查**: Production 部署失敗時觸發回滾
    - [ ] **回滾邏輯**: 使用 `kubectl rollout undo` 回滾到前一個成功版本
    - [ ] **健康檢查**: 回滾後驗證服務正常運作
    - [ ] **安全限制**: 只在有前一版本時執行回滾

  - [ ] **通知和監控系統**:
    - [ ] **失敗通知**: 自動在GitHub創建 issue，標記為 high-priority
    - [ ] **成功通知**: GitHub Notification + PR comment
    - [ ] **Slack 整合**: (選用) 重要事件通知到 Slack 頻道
    - [ ] **狀態頁面**: (選用) 簡單的服務狀態頁面

- [ ] **7. 測試、監控：**

  - [ ] **Pipeline 測試策略**:
    - [ ] **測試環境**: 使用 staging 環境進行 end-to-end 測試
    - [ ] **自動化測試**: PR workflow 測試 + Production 部署測試
    - [ ] **回滾測試**: 模擬部署失敗測試回滾機制

  - [ ] **效能和成本監控**:
    - [ ] **GitHub Actions 成本**: 監控 minutes 使用量和成本
    - [ ] **Pipeline 時間**: 設定 timeout 和效能指標 (CI<10min, Deploy<15min)
    - [ ] **資源使用**: Staging 環境資源監控和使用率分析

- [ ] **8. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` for CI/CD
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除
    - [ ] **Workflow 文檔**: 說明所有 workflows 用途
    - [ ] **操作手冊**: 常用 CI/CD 操作 (deploy, rollback, cleanup)
    - [ ] **故障排除指南**: 常見 CI/CD 問題和解決方案
    - [ ] **安全稽核**: OIDC 設定和權限審查清單

#### 階段 6：基礎監控體系

> 技術：GCP Cloud Monitoring + 健康檢查 + 成本告警

**目標：實現輕量化服務監控，適合 Side Project 的最小可行監控方案**

**核心特色**：
- GCP 內建監控服務整合
- K8s 原生健康檢查機制
- 成本預算告警和資源監控
- 結構化日誌和故障排除

**重要依賴**：此階段建立在 Stage 4 的健康檢查配置基礎上

- [ ] **1. 基礎監控設置：**
  - [ ] 使用 GCP Cloud Monitoring（免費額度內）+ 簡單 Grafana
  - [ ] 或直接使用 GCP 內建監控儀表板
  - [ ] 驗證基本的 Pod 和服務狀態可見性

- [ ] **2. 基本健康檢查：**  
  - [ ] 驗證 Stage 4 已配置的健康檢查機制運作正常
  - [ ] 前端 HTTP 健康檢查和後端 exec 健康檢查狀態監控
  - [ ] 確認 Pod 重啟和恢復機制正常運作

- [ ] **3. 基本成本監控：**
  - [ ] 設置 GCP 預算告警（月度成本超過閾值）
  - [ ] 檢查 GKE Autopilot 資源使用是否合理
  - [ ] 可配置 Slack 通知（選用）

- [ ] **4. 簡單日誌查看：**
  - [ ] 確保應用日誌輸出到 stdout/stderr  
  - [ ] 使用 `kubectl logs` 查看日誌
  - [ ] 可選擇使用 GCP Cloud Logging 進行日誌保存

- [ ] **5. 基礎告警設置：**
  - [ ] Email 通知服務異常和成本超標告警
  - [ ] 驗證告警通知功能正常運作

- [ ] **6. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` for monitoring
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

### 整理 Documentations
- [ ] 整理 Contracts 的 `README.md`
- [ ] 整理 Backend 的 `README.md`
- [ ] 整理 Frontend 的 `README.md`
- [ ] 整理 DevOps 的 `README.md`
- [ ] 整理 主目錄的 `README.md`