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

> 階段式 DevOps 實作流程：Docker + Kubernetes + GCP + Terraform + GitHub Actions (CI/CD) + Monitoring (Grafana/Prometheus)

> 擁有 Staging 和 Production 兩種環境

| 階段 | 內容                    | 技術                       | 目標       |
| ---- | ----------------------- | -------------------------- | ---------- |
|  1   | 基礎容器化              | Docker + Docker Compose    | 建立容器化設定檔 |
|  2   | GCP 帳號設定           | GCP Console + 手動設定      | 完成無法自動化的帳號層級設定 |
|  3   | 基礎設施自動化部署       | Terraform + GKE + cert-manager + Cloudflare DNS + HTTPS | 完成基礎設施，包含 GCP + GKE + SSL |
|  4   | K8s 應用部署準備        | K8s + Artifact Registry + Ingress | 手動驗證完整部署流程 |
|  5   | 自動化 CI/CD 流水線      | GitHub Actions + GCP + OIDC + 多環境管理 | 自動化驗證和部署到 GCP |
|  6   | 監控觀測體系            | GCP Monitoring + 健康檢查 + 成本監控 | 建立完整監控觀測體系 |


---
#### 階段 1：基礎容器化

> 技術：Docker + Docker Compose

**目標：建立容器化設定檔**

- [ ] **1. 撰寫 Dockerfile：**
  - [ ] 撰寫 `Dockerfile.backend` (尚未開發完成，先暫停)
    - 後端為守護進程，故不需有對外的 API
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

- [x] **4. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for docker
  - [x] 整理內容到 `docs/DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 2：GCP 帳號設定

> 技術：GCP Console + 手動設定

**目標：完成無法自動化的帳號層級設定**

- [x] **1. GCP 帳號與計費設定**（無法自動化的部分）：
  - [x] 註冊 GCP 帳號（新用戶可獲得 $300 免費額度）
  - [x] 建立專案 `ton-cat-lottery-dev-3`
  - [x] 設定計費帳戶與預算告警（$50/月 開發限制）
  - [x] **預算管理優化：**
    - [x] 設定多層級預算告警：25%、50%、75%、90% 閾值
    - [x] 環境別預算分配：staging(\$15/月), production(\$30/月), monitoring(\$5/月)
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

- [x] **4. 內容整理：**
  - [x] 重新驗證這個階段的 todos
  - [x] 更新主目錄`.gitignore` for GCP
  - [x] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---
#### 階段 3：模塊化基礎設施與智能路由 HTTPS 配置

>技術：Terraform Modules + GKE Autopilot + cert-manager + Cloudflare DNS + 單IP多域名架構

**目標：建立模塊化 GKE 集群，配置單一靜態IP搭配智能路由，支援Production永久環境和Staging動態多分支環境**

**架構設計（單IP + 智能路由 + 動態環境）**：
```
Internet → Cloudflare DNS → 單一靜態IP → GKE Ingress (智能路由)
├── cat-lottery.chaowei-liu.com → production namespace (永久)
├── *.dev.cat-lottery.chaowei-liu.com → staging namespaces (動態)
│   ├── pr-123.dev.cat-lottery.chaowei-liu.com → pr-123 namespace
│   └── feature-x.dev.cat-lottery.chaowei-liu.com → feature-x namespace
└── 自動SSL證書管理 (wildcard + 主域名)
```


- [ ] **1. Terraform 模塊化架構設計：**

  - [ ] **建立模塊化目錄結構**:
    ```
    terraform/
    ├── modules/
    │   ├── gke/           # GKE 集群模組
    │   ├── networking/    # VPC 和網路模組  
    │   ├── dns/          # Cloudflare DNS 模組
    │   ├── ssl/          # cert-manager 模組
    │   └── iam/          # 權限管理模組
    ├── environments/
    │   └── production/   # 生產環境配置
    ├── main.tf           # 模組組裝
    ├── variables.tf      # 全域變數
    ├── outputs.tf        # 輸出定義
    └── terraform.tfvars # 實際變數值
    ```

  - [ ] **GCP API 啟用優化 Checklist**:
    - [ ] `container.googleapis.com` - GKE API
    - [ ] `compute.googleapis.com` - 計算和網路API
    - [ ] `artifactregistry.googleapis.com` - 容器映像儲存（推薦）
    - [ ] `iam.googleapis.com` - 權限管理API
    - [ ] `cloudresourcemanager.googleapis.com` - 資源管理API
    - [ ] `servicenetworking.googleapis.com` - VPC 連線API
    - [ ] **移除不必要**: 不啟用 `cloudbuild.googleapis.com`（使用 GitHub Actions）

  - [ ] **核心資源精簡清單**:
    |         Resource Type              |     數量     |     用途     |
    | ---------------------------------- | ----------- | ------------ |
    | google_project_service             | 6個         | API 啟用 |
    | google_container_cluster           | 1個         | GKE Autopilot 叢集 |
    | google_compute_network             | 1個         | 主要VPC網路 |
    | google_compute_subnetwork          | 1個         | GKE子網路 |
    | google_compute_router              | 1個         | NAT 路由器 |
    | google_compute_router_nat          | 1個         | NAT Gateway |
    | google_artifact_registry_repository| 1個         | 容器映像庫 |
    | google_compute_address             | **1個**     | **單一靜態IP** |
    | google_service_account             | 2個         | GKE + CI/CD SA |
    | helm_release                       | 1個         | cert-manager |
    | kubernetes_manifest                | 2個         | SSL ClusterIssuer |
    | cloudflare_record                  | **2個**     | **主域名 + wildcard** |

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
    - [ ] `modules/dns/main.tf` - Cloudflare DNS 智能配置
      - [ ] 主域名: `cat-lottery.chaowei-liu.com` → 靜態IP
      - [ ] **Wildcard**: `*.dev.cat-lottery.chaowei-liu.com` → 同一靜態IP
      - [ ] 支援動態子域名創建（CI/CD使用）
    - [ ] `modules/ssl/main.tf` - cert-manager + 雙證書策略
      - [ ] Production ClusterIssuer: 主域名證書
      - [ ] Staging ClusterIssuer: wildcard 證書 (`*.dev.cat-lottery.chaowei-liu.com`)
    - [ ] `modules/iam/main.tf` - 最小權限服務帳戶
      - [ ] GKE 節點服務帳戶
      - [ ] CI/CD 部署服務帳戶（Workload Identity）

  - [ ] **環境配置整合**:
    - [ ] `main.tf` - 模組組裝和依賴管理
    - [ ] `variables.tf` - 精簡變數定義
      ```hcl
      variable "project_id" { type = string }
      variable "region" { default = "asia-east1" }
      variable "domain_root" { default = "cat-lottery.chaowei-liu.com" }
      variable "cloudflare_api_token" { sensitive = true }
      variable "letsencrypt_email" { type = string }
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
    - [ ] **Terraform服務帳戶權限** ⭐ **必要**:
      - [ ] `roles/container.admin` - GKE 管理
      - [ ] `roles/compute.networkAdmin` - 網路管理 
      - [ ] `roles/iam.serviceAccountAdmin` - SA 管理
      - [ ] `roles/storage.objectAdmin` - State 管理
      - [ ] **驗證最小權限原則**

- [ ] **3. 智能部署和驗證流程：**

  - [ ] **模塊化部署策略**：
    - [ ] **階段式部署**: `terraform apply -target=module.networking` 先建立網路
    - [ ] **GKE部署**: `terraform apply -target=module.gke` 建立集群
    - [ ] **完整部署**: `terraform apply` 部署DNS + SSL + IAM
    - [ ] **部署驗證**: 每階段都有驗證檢查點

  - [ ] **基礎設施驗證** ⭐ **關鍵**：
    - [ ] **GKE 集群健康**: `kubectl get nodes -o wide`
    - [ ] **單一靜態IP確認**: `gcloud compute addresses list --filter="name:tcl-ingress-ip"`
    - [ ] **VPC 和子網路**: `gcloud compute networks list`
    - [ ] **cert-manager就緒**: `kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s`

  - [ ] **DNS 和SSL驗證** (⏱ **重要時間估算**)：
    - [ ] **DNS 傳播等待**: 10-60分鐘（Cloudflare全球傳播）
    - [ ] **主域名驗證**: 
      ```bash
      # 驗證主域名
      dig cat-lottery.chaowei-liu.com @8.8.8.8
      # 驗證wildcard
      dig test.dev.cat-lottery.chaowei-liu.com @8.8.8.8
      ```
    - [ ] **SSL證書自動申請**:
      ```bash
      # 等待主域名證書
      kubectl wait certificate/production-tls --for=condition=Ready -n cert-manager --timeout=600s
      # 等待wildcard證書  
      kubectl wait certificate/staging-wildcard-tls --for=condition=Ready -n cert-manager --timeout=600s
      ```

  - [ ] **環境準備**:
    - [ ] **Production namespace**: `kubectl create namespace tcl-production`
    - [ ] **基礎標籤和annotations**: 統一標籤策略
    - [ ] **RBAC準備**: 基本權限配置


- [ ] **4. 災難恢復：**

  - [ ] **災難恢復策略** ⭐ **新增重要項目**:
    - [ ] **跨區域備份**: 設置 GCS bucket 跨區域複寫
    - [ ] **Infrastructure as Code 備份**: Git + 加密的 terraform.tfvars
    - [ ] **恢復程序文檔**: 記錄完整的災難恢復步驟
    - [ ] **測試恢復流程**: 每季度執行一次恢復演練

  - [ ] **成本優化驗證**:
    - [ ] **單IP架構節省**: 驗證相較雙IP架構的成本節省（~$15/月）
    - [ ] **GKE Autopilot效率**: 確認按需付費機制正常工作
    - [ ] **資源標籤**: 確保所有資源有成本追蹤標籤
    - [ ] **預算告警**: 設置月度預算告警($50閾值)


- [ ] **5. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` - terraform 計劃檔案和敏感內容
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除(DNS/SSL/GKE)

---
#### 階段 4：單一 Ingress 多環境部署架構

>技術：Kubernetes + Docker + 智能 Ingress 路由 + cert-manager + 動態 namespace

**目標：建立精簡的單 Ingress 多環境架構，部署穩定 Production 環境和彈性 Staging 環境模板**

**架構設計（單 Ingress + 智能路由）**：
```
單一 GKE Ingress (tcl-ingress-ip) + cert-manager
├── cat-lottery.chaowei-liu.com → tcl-production namespace (永久)
│   ├── frontend-service:80 → React 應用
│   └── backend-service:8080 → Go API
├── *.dev.cat-lottery.chaowei-liu.com → tcl-staging-* namespaces (動態)
│   ├── pr-123.dev.cat-lottery.chaowei-liu.com → tcl-staging-pr123
│   └── feature-x.dev.cat-lottery.chaowei-liu.com → tcl-staging-feature-x
└── SSL: 主域名 + wildcard 證書 (自動管理)
```

- [ ] **1. 環境準備和驗證：**

  - [ ] **基礎設施確認** (依賴階段3完成):
    - [ ] **GKE 集群健康**: `kubectl get nodes -o wide` (確認所有節點 Ready)
    - [ ] **單一靜態IP**: `gcloud compute addresses describe tcl-ingress-ip --region=asia-east1`
    - [ ] **Artifact Registry**: `gcloud artifacts repositories describe tcl-repo --location=asia-east1`
    - [ ] **SSL證書狀態**: `kubectl get certificates -A` (確認 production + wildcard 都 Ready)
    - [ ] **DNS解析確認**: 
      ```bash
      dig +short cat-lottery.chaowei-liu.com
      dig +short test.dev.cat-lottery.chaowei-liu.com
      ```
  
  - [ ] **工具和設置準備**:
    - [ ] Docker buildx 設置: `docker buildx create --use --name tcl-builder`
    - [ ] GCP 認證配置: `gcloud auth configure-docker asia-east1-docker.pkg.dev`
    - [ ] kubectl 上下文: `gcloud container clusters get-credentials tcl-cluster --region asia-east1`
    - [ ] **envsubst 工具**: `which envsubst` (依賴動態範本)

- [ ] **2. 精簡 Docker 映像策略：**

  - [ ] **統一映像標籤策略** ⭐ **簡化關鍵**:
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
  
  - [ ] **映像優化和安全** (選用):
    - [ ] **多階段建構**: 利用 Docker 層級快取
    - [ ] **安全掃描**: 使用 `docker scout` 或 GCP 內建掃描
    - [ ] **映像簽章**: 生產環境可考慮使用 cosign
    - [ ] **清理策略**: 設定舊映像自動清理 (30天)

- [ ] **3. 構建 K8s 部署檔案（Production + Staging 模板）：**
  - 組織 `k8s/` 目錄結構：`production/`, `staging-template/`, `ingress/`
  - [ ] **Production 環境配置（永久部署）**:
    - [ ] `k8s/production/namespace.yaml` - Production 命名空間
    - [ ] `k8s/production/configmap.yaml` - Production 環境變數
    - [ ] `k8s/production/secret.yaml` - Production 敏感資訊
    - [ ] `k8s/production/deployment.yaml` - Production 應用部署
    - [ ] `k8s/production/service.yaml` - Production 服務配置
  - [ ] **Staging 模板配置（CI/CD 動態使用）**:
    - [ ] `k8s/staging-template/` - Staging 環境模板（用於 CI/CD 動態創建）
    - [ ] 使用環境變數替換域名和配置參數
    - [ ] 較小的資源限制適合短期測試
  - [ ] **雙 Ingress 配置（分離的 SSL 和路由）**:
    - [ ] **Production Ingress**: `k8s/ingress/production-ingress.yaml`
      - [ ] 使用靜態IP-1：`kubernetes.io/ingress.global-static-ip-name: "prod-ip"`
      - [ ] 域名：`cat-lottery.chaowei-liu.com` → production namespace
      - [ ] 獨立 SSL 證書：`production-tls-secret`
    - [ ] **Staging Ingress 模板**: `k8s/ingress/staging-ingress-template.yaml`
      - [ ] 使用靜態IP-2：`kubernetes.io/ingress.global-static-ip-name: "staging-ip"`
      - [ ] 域名：`dev.cat-lottery.chaowei-liu.com` → staging namespace
      - [ ] 獨立 SSL 證書：`staging-tls-secret`
      - [ ] CI/CD 動態創建和刪除
    - [ ] 配置 cert-manager ClusterIssuer 支援雙域名
  - [ ] **資源管理和隔離**:
    - [ ] NetworkPolicy 確保 namespace 間網路隔離
    - [ ] ResourceQuota 設置環境資源限制
    - [ ] Production 適當 requests，Staging 較小 limits

- [ ] **4. 安全性和生產準備（生產部署前必須完成）：**
  - [ ] 移除硬編碼的測試值，使用 Secret 和 ConfigMap
  - [ ] 配置適當的資源請求和限制
  - [ ] 添加 Pod Security Context（非 root 用戶）
  - [ ] 配置 Horizontal Pod Autoscaler (HPA)
  - [ ] 設定適當的 labels 和 annotations
  - [ ] **進階安全配置**：
    - [ ] Pod Security Standards (PSS) 實施
    - [ ] Service Account 最小權限配置
    - [ ] Secret 加密和外部管理
    - [ ] 映像掃描集成
  - [ ] **生產就緒配置**：
    - [ ] 健康檢查端點配置
    - [ ] 優雅關機設置
    - [ ] 資源監控和調整

- [ ] **5. 手動測試 Production 部署流程：**
  - 取得 GKE 叢集憑證：`gcloud container clusters get-credentials ton-cat-lottery-cluster --region asia-east1`
  - [ ] **Production 環境部署**:
    - [ ] 創建 production namespace：`kubectl apply -f k8s/production/namespace.yaml`
    - [ ] 部署 Production 應用：`kubectl apply -f k8s/production/`
    - [ ] 部署 Production Ingress：`kubectl apply -f k8s/ingress/production-ingress.yaml`
  - [ ] **SSL 證書配置**:
    - [ ] **前置條件檢查**: 確認雙域名 DNS 已從階段 3 傳播完成
      ```bash
      # 驗證雙域名解析
      nslookup cat-lottery.chaowei-liu.com    # 應解析到靜態IP-1
      nslookup dev.cat-lottery.chaowei-liu.com # 應解析到靜態IP-2
      ```
    - [ ] **配置 Cloudflare API Secret**: 創建包含 Cloudflare API Token 的 K8s Secret
      ```bash
      kubectl create secret generic cloudflare-api-token-secret \
        --from-literal=api-token=YOUR_CLOUDFLARE_API_TOKEN \
        -n cert-manager
      ```
    - [ ] **等待 Production SSL 證書**: `kubectl get certificate production-tls-secret` (狀態變為 Ready)
  - [ ] **Production 環境驗證**:
    - [ ] **部署狀態驗證**: 
      ```bash
      # 等待 Production 組件就緒
      kubectl wait deployment/frontend --for=condition=Available --timeout=300s -n ton-cat-lottery-prod
      kubectl wait deployment/backend --for=condition=Available --timeout=300s -n ton-cat-lottery-prod
      kubectl wait certificate/production-tls-secret --for=condition=Ready --timeout=600s
      ```
    - [ ] **Production 應用驗證**:
      - [ ] 檢查 Pod 狀態：`kubectl get pods -n ton-cat-lottery-prod`
      - [ ] 檢查 Service：`kubectl get svc -n ton-cat-lottery-prod`
      - [ ] 測試 Production 域名：`curl -I https://cat-lottery.chaowei-liu.com`
    - [ ] **Production Ingress 和證書驗證**:
      - [ ] 檢查 Production Ingress：`kubectl get ingress production-ingress` (確認使用靜態IP-1)
      - [ ] 檢查 Production 證書：`kubectl get certificate production-tls-secret` (狀態應為 Ready)
      - [ ] 驗證 SSL 證書：`openssl s_client -connect cat-lottery.chaowei-liu.com:443`

- [ ] **6. Staging 環境模板驗證（手動測試動態流程）：**
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

- [ ] **7. 效能和監控驗證：**
  - 配置 Google Cloud Monitoring 集成
  - 設定日誌收集和查詢
  - 測試應用在負載下的表現
  - 驗證 HPA 自動擴縮容功能

- [ ] **8. 內容整理：**
  - [ ] 重新驗證這個階段的 todos
  - [ ] 更新主目錄`.gitignore` for k8s
  - [ ] 整理內容到 `DevOpsREADME.md` 中，包含：架構 + 簡介 + 檔案結構 + 快速部署 + 常用指令 + 故障排除

---

#### 階段 5：智能 CI/CD 和彈性環境管理

>技術：GitHub Actions + GCP OIDC + 動態 Namespace + 智能清理

**目標：實現 PR-based Staging 創建、Production 自動部署、智能環境清理的完整 CI/CD 流程**

**新架構設計（智能 CI/CD 流程）**：
```
Pull Request → 創建 PR-specific Staging 環境 → 測試 → 自動清理
├── PR #123 → pr-123.dev.cat-lottery.chaowei-liu.com → tcl-staging-pr123
├── Feature branch → feature-x.dev.cat-lottery.chaowei-liu.com → tcl-staging-feature-x  
└── Main merge → Production 部署 + 批量清理過期 Staging

環境生命週期管理：
├── PR Staging: 創建 → 測試 → PR關閉時清理
├── Feature Staging: 手動創建 → 分支刪除時清理 (TTL: 7天)
└── Production: 永久環境 → 滾動更新 → 自動備份
```

- [ ] **1. 準備階段：**
  - [ ] 建立 `.github/workflows/` 目錄結構
  - [ ] 一次性 WIF 設定
    - 建立 Service Account gha-deploy 並授權所需角色
    - 建立 Workload Identity Pool & Provider（issuer: https://token.actions.githubusercontent.com）
    - 將 YOURORG/your-repo 與 gha-deploy 綁定 `roles/iam.workloadIdentityUser`
  - [ ] 在 repo 的頁面中，設定 Rulesets
    - Restrict deletions
    - Require a pull request before merging
    - Block force pushes

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

##### 階段 6：Monitoring

> 技術：Grafana + Prometheus + GCP Cloud Monitoring

**目標：輕量化監控，適合 Side Project 的最小可用配置**

- [ ] **1. 最簡監控設置：** ⭐ **必要項目**
  - [ ] 使用 GCP Cloud Monitoring（免費額度內）+ 簡單 Grafana
  - [ ] 或考慮直接使用 GCP 內建監控儀表板（更簡單）
  - [ ] **驗證**：確認能看到基本的 Pod 和服務狀態

- [ ] **2. 基本健康檢查：** ⭐ **必要項目**  
  - [ ] 在 K8s Deployment 中添加 `livenessProbe` 和 `readinessProbe`
  - [ ] 後端實作 `/health` endpoint（簡單的 200 OK 即可）
  - [ ] **驗證**：確認 Pod 能正常重啟和恢復

- [ ] **3. 基本成本監控：**
  - [ ] 設置 GCP 預算告警（月度成本超過閾值）
  - [ ] 檢查 GKE Autopilot 資源使用是否合理
  - [ ] **選用**: 如果成本超標，設置簡單的 Slack 通知

- [ ] **4. 簡單日誌查看：**
  - [ ] 確保應用日誌輸出到 stdout/stderr  
  - [ ] 使用 `kubectl logs` 查看日誌（最簡單）
  - [ ] **選用**: 如果需要保存日誌，依賴 GCP Cloud Logging（有免費額度）

- [ ] **5. 最簡告警告：**
  - [ ] **必要**: Email 通知當服務完全掛掉時
  - [ ] **選用**: 成本超標時的 Email 告警  
  - [ ] **驗證**: 手動測試一次告警是否能收到

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