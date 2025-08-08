# 🐱 TON Cat Lottery - 智能合約文檔

> 基於 TON 區塊鏈的貓咪 NFT 抽獎系統

---

## 📋 目錄

- [📁 檔案結構](#-檔案結構)
- [🎯 項目概覽](#-項目概覽)
- [🔄 系統架構與模組流程](#-系統架構與模組流程)
- [🚀 快速開始](#-快速開始)
- [🌐 部署（測試網）](#-部署測試網)
- [🛠️ 故障排除](#️-故障排除)
- [📚 參考資源](#-參考資源)


---
## 📁 檔案結構

```
contracts/
├── CatLottery.tact          # 主抽獎合約
├── CatNFT.tact             # 貓咪 NFT 合約
├── scripts/
│   ├── deployCatLottery.ts  # 抽獎合約部署腳本
│   ├── deployCatNFT.ts     # NFT 合約部署腳本
│   ├── integrationTest.ts   # 合約整合測試腳本
│   └── testNFTContract.ts   # NFT 合約邏輯測試
├── build/                  # 編譯後的合約檔案
└── tact.config.json        # Tact 編譯配置
```

### 🎯 **CatLottery.tact** - 主要功能函數

#### 接收器 (Receivers)
- `receive("join")` - 用戶參與抽獎
- `receive("drawWinner")` - 執行抽獎（僅擁有者）
- `receive("startNewRound")` - 開始新輪次（僅擁有者）
- `receive("withdraw")` - 提取合約餘額（僅擁有者）
- `receive(msg: SetNFTContract)` - 設定 NFT 合約地址（僅擁有者）

#### 內部函數 (Internal Functions)
- `fun sendNFT(winner: Address, nftId: Int)` - 自動發送 NFT 給中獎者
- `fun getCatNameByTemplate(templateId: Int): String` - 根據模板 ID 獲取貓咪名稱

#### 查詢函數 (Getters)
- `get fun getContractInfo(): ContractInfo` - 獲取合約基本資訊
- `get fun getParticipant(index: Int): Participant?` - 獲取參與者資訊
- `get fun getWinner(round: Int): LotteryResult?` - 獲取指定輪次中獎記錄
- `get fun getBalance(): Int` - 獲取合約餘額

### 🐱 **CatNFT.tact** - 主要功能函數

#### 接收器 (Receivers)
- `receive(msg: MintTo)` - 鑄造 NFT（僅授權鑄造者）
- `receive(msg: NFTTransfer)` - NFT 轉移
- `receive(msg: SetAuthorizedMinter)` - 設定授權鑄造者（僅擁有者）

#### 內部函數 (Internal Functions)
- `fun initializeCatTemplates()` - 初始化 4 種貓咪模板
- `fun determineRarity(tokenId: Int): Int` - 基於機率確定稀有度

#### 查詢函數 (Getters)
- `get fun getNFT(tokenId: Int): NFTData?` - 獲取 NFT 詳細資料
- `get fun balanceOf(owner: Address): Int` - 獲取地址擁有的 NFT 數量
- `get fun getCatTemplate(templateId: Int): CatMetadata?` - 獲取貓咪模板
- `get fun getContractInfo(): NFTContractInfo` - 獲取 NFT 合約資訊
- `get fun getAllCatTemplates(): map<Int, CatMetadata>` - 獲取所有貓咪模板



---

## 🎯 項目概覽

TON Cat Lottery 包含兩個主要智能合約：

### 🎪 核心合約

1. **CatLottery.tact** - 主抽獎合約 ✅

   - ✅ **完整抽獎流程管理** - 用戶參與、驗證條件、記錄參與者
   - ✅ **智能隨機抽獎機制** - 基於時間戳和上下文資訊的安全隨機數
   - ✅ **自動 NFT 發送邏輯** - drawWinner 後自動調用 sendNFT() 
   - ✅ **完善狀態管理** - lotteryActive、participantCount、currentRound 自動管理
   - ✅ **事件驅動系統** - ParticipantJoined、LotteryFull、WinnerDrawn、NFTSent、NewRoundStarted
   - ✅ **自動重置機制** - 抽獎完成後自動清理狀態，等待 startNewRound
   - ✅ **重複參與防護** - 同一地址無法重複參與同一輪次
   - ✅ **擁有者權限控制** - drawWinner、startNewRound、withdraw 僅擁有者可執行

2. **CatNFT.tact** - 貓咪 NFT 合約 ✅

   - ✅ **符合 TON NFT 規範** - 完整的 NFT 標準實作
   - ✅ **4 種稀有度貓咪** - Common (60%), Rare (25%), Epic (10%), Legendary (5%)
   - ✅ **豐富 NFT Metadata** - name, description, rarity, attributes, image
   - ✅ **授權鑄造機制** - 只有 CatLottery 合約可鑄造 NFT
   - ✅ **完整所有權管理** - NFT 轉移、擁有者計數、ownership tracking
   - ✅ **自動稀有度分配** - 基於機率的智能稀有度確定系統

### 🎨 NFT 稀有度系統

| 稀有度        | 機率  | 名稱             | 描述                   | 屬性                                    |
| ------------- | ----- | ---------------- | ---------------------- | --------------------------------------- |
| **Common**    | 60%   | Tabby            | 友善的虎斑貓         | 橙色虎斑毛色、綠色眼睛、友善性格       |
| **Rare**      | 25%   | Siamese Princess | 優雅的暹羅貓，藍色眼睛 | 暹羅奶油毛色、藍色眼睛、優雅性格       |
| **Epic**      | 10%   | Maine Coon King  | 威嚴的緬因貓，王者風範 | 緬因貓棕色毛色、琥珀色眼睛、威嚴性格   |
| **Legendary** | 5%    | Cosmic Cat       | 神秘的宇宙貓，來自星空 | 宇宙紫色毛色、星光眼睛、神秘性格       |

### 🔧 **技術特色**

#### **智能合約安全特性**
- ✅ **重入攻擊防護** - 正確的狀態更新順序和檢查
- ✅ **授權控制** - 嚴格的擁有者和授權鑄造者權限管理  
- ✅ **輸入驗證** - 完整的 require 語句覆蓋所有邊界條件
- ✅ **餘額檢查** - 參與費用驗證和合約餘額管理

#### **高可用性設計**
- ✅ **事件完整性** - 所有關鍵操作都發出相應事件
- ✅ **狀態一致性** - 自動狀態管理確保合約狀態始終正確
- ✅ **失敗恢復** - drawWinner 失敗不影響下次執行
- ✅ **可觀測性** - 豐富的查詢函數支援狀態檢查

#### **Gas 優化**
- ✅ **高效隨機數生成** - 基於鏈上資訊避免外部依賴
- ✅ **批量狀態更新** - 在單一交易中完成多個狀態變更
- ✅ **適當的 Gas 費用配置** - 為 NFT 鑄造和通知預留充足 Gas


---
## 🔄 系統架構與模組流程

### 📊 **整體架構**

```
┌─────────────┐                    ┌─────────────┐
│    前端     │◄──────直接通信──────►│ TON 區塊鏈  │
│ (React)     │   TON Connect SDK   │  智能合約   │
└─────────────┘                    └─────────────┘
                                           ▲
                                           │
                                    監聽合約狀態
                                           │
                                    ┌──────────────┐
                                    │   後端服務   │
                                    │ (Go Service) │
                                    │  守護進程    │
                                    └──────────────┘
                                           │
                                    自動執行交易
                                    (drawWinner/NFT)
```

**架構說明**：
- **前端 ↔ 智能合約**: 用戶直接通過 TON Connect 與合約互動，無需經過後端
- **後端守護進程**: 完全獨立運行，不提供對外 API，專職監聽合約狀態並執行自動化任務
- **後端 → 智能合約**: 單向操作，只負責發送 drawWinner 和 startNewRound 交易
- **智能合約**: 內建 NFT 自動發送邏輯，無需後端干預

### 🎯 **核心模組流程**

#### **階段 1: 用戶參與抽獎**
```
用戶點擊參與 → TON Connect 錢包連接 → 發送 0.1 TON + "join" → CatLottery 合約
  ↓
合約驗證參與條件 → 記錄參與者 → 檢查人數 → 觸發事件
  ↓
- 未滿 3 人: 發送 ParticipantJoined 事件
- 達到 3 人: 發送 LotteryFull 事件 + 停止接受新參與者
```

#### **階段 2: 智能監聽系統** (混合策略)
```
並行監聽模式:
┌─────────────────┐  ┌──────────────────┐
│   事件監聽器      │  │   輪詢檢查器      │
│  (即時響應)       │ │   (保底機制)       │
│                 │  │                  │
│ LotteryFull事件  │  │  每30秒檢查合約    │
│   ↓ 1-5秒        │  │   ↓ 最多30秒     │
└─────────────────┘   └─────────────────┘
         │                    │
         └────────┬───────────┘
                  ↓
        自動觸發 drawWinner 交易
```

#### **階段 3: 自動抽獎執行**
```
觸發條件滿足 → 後端創建 drawWinner 交易 → 發送至 CatLottery 合約
  ↓
合約執行抽獎邏輯 → 選出中獎者 → 生成 NFT ID
  ↓
合約自動調用 sendNFT() → 發送 MintTo 給 CatNFT 合約 → NFT 鑄造
  ↓
發送 WinnerDrawn 事件 (包含: winner, nftId, round)
  ↓
發送 NFTSent 事件 (包含: recipient, nftId, nftContract)
```

#### **階段 4: 狀態重置** 
```
drawWinner 執行完成 → 合約自動重置狀態:
  - lotteryActive = false (暫停接受新參與者)
  - participantCount = 0 (清空參與者計數)
  - 清空 participants 映射
  ↓
等待後端發送 startNewRound 來重新啟動
```

#### **階段 5: 新輪次啟動**
```
後端監聽到 WinnerDrawn 事件 → 確認抽獎完成 → 發送 startNewRound 交易
  ↓
CatLottery 合約執行新輪次邏輯:
  - lotteryActive = true (重新開放參與)
  - participantCount = 0 (已重置) 
  - currentRound += 1 (輪次遞增)
  - participants 映射 (已清空)
  ↓
系統準備接受下一輪參與者，完成自動循環
```

### ⚡ **關鍵技術特點**

#### **1. 雙重監聽保障**
- **主要**: 事件監聽 (WebSocket) - 響應速度 1-5 秒
- **備用**: 定時輪詢 - 每 30 秒檢查，防止事件遺漏

#### **2. 自動化流程**
- 人數達標 → 合約觸發 LotteryFull 事件 → 後端自動執行 drawWinner
- 抽獎執行 → 合約內建自動發送 NFT (sendNFT) → 觸發 WinnerDrawn 事件
- 事件監聽 → 後端自動執行 startNewRound → 開始新輪次循環

#### **3. 錯誤處理機制**
- 交易失敗自動重試 (最多 3 次)
- 網路異常時切換到輪詢模式
- 完整的日誌記錄和監控

#### **4. 事件驅動架構**
```
合約事件 → 後端監聽 → 自動處理 → 狀態更新 → 前端刷新
```

### 🔄 **完整生命周期**
```
新輪次開始 → 用戶參與 → 達到3人 → 自動抽獎 → 發送NFT → 重置輪次
     ↑                                                         │
     └─────────────────── 自動循環 ──────────────────────────────┘
```

---
## 🚀 快速開始

### 📋 前置需求
- Node.js >= 22
- TON Connect 錢包（如 Tonkeeper）
- 測試網 TON 代幣

### ⚡ 編譯合約
```bash
cd contracts
npm install
npm run build
```

### 🚀 部署合約

#### 1. 部署 NFT 合約
```bash
npx blueprint run deployCatNFT --testnet
```

#### 2. 部署抽獎合約  
```bash
npx blueprint run deployCatLottery --testnet
```

#### 3. 設定合約授權
```bash
# 設定 NFT 合約的授權鑄造者為抽獎合約
# 設定抽獎合約的 NFT 合約地址

npx blueprint run integrationTest --testnet
```

---
## 🌐 部署（測試網）

### 📍 **已部署合約地址**

| 合約類型        | 地址                                                    | 狀態    |
| --------------- | ------------------------------------------------------ | ------- |
| **CatNFT**      | `kQAGSpk8Heq1xkTAL3q1DfxuSFGopYm6xXgNPN9Yexe0JTK7`   | ✅ 已部署 |
| **CatLottery**  | _待部署_                                               | ⏳ 待部署 |

### 🔗 **區塊鏈瀏覽器連結**
- [CatNFT 合約詳情](https://testnet.tonviewer.com/kQAGSpk8Heq1xkTAL3q1DfxuSFGopYm6xXgNPN9Yexe0JTK7)
- [TON Testnet Explorer](https://testnet.tonviewer.com/)

### ⚙️ **合約參數配置**
- **參與費用**: 0.01 TON
- **最大參與人數**: 3 人  
- **稀有度機率**: Common (60%), Rare (25%), Epic (10%), Legendary (5%)

---
## 🛠️ 故障排除

### ❌ 常見問題

#### **合約部署失敗**
- 確認錢包有足夠 TON（至少 0.3 TON）
- 檢查網路連接
- 重試部署指令

#### **交易被拒絕**
- 檢查參與費用是否足夠（≥ 0.01 TON）
- 確認未重複參與同一輪次
- 檢查抽獎是否仍活躍

#### **NFT 鑄造失敗**  
- 確認 CatLottery 已設定正確的 NFT 合約地址
- 確認 CatNFT 已設定 CatLottery 為授權鑄造者
- 檢查合約餘額是否足夠支付 NFT 鑄造 Gas

### 🔍 **除錯工具**
- 使用 `integrationTest.ts` 進行完整流程測試
- 檢查合約事件日誌
- 使用 TON Explorer 查看交易詳情


---
## 📚 參考資源

- [TON Blueprint](https://github.com/ton-org/blueprint)
- [TON Testnet Explorer](https://testnet.tonviewer.com/)
- [Tact 語言文檔](https://docs.tact-lang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/)