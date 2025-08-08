# 🐱 TON Cat Lottery - 智能合約文檔

> 基於 TON 區塊鏈的貓咪 NFT 抽獎系統

---

## 📋 目錄


---

## 🎯 項目概覽

TON Cat Lottery 包含兩個主要智能合約：

### 🎪 核心合約

1. **CatLottery.tact** - 主抽獎合約

   - 管理抽獎流程和參與者
   - 執行隨機抽獎機制
   - 自動發送 NFT 獎勵

2. **CatNFT.tact** - 貓咪 NFT 合約
   - 鑄造獨特的貓咪 NFT
   - 4 種稀有度等級 (Common, Rare, Epic, Legendary)
   - 完整的所有權管理

### 🎨 NFT 列表

| 稀有度        | 名稱             | 描述                   |
| ------------- | ---------------- | ---------------------- |
| **Common**    | Tabby            | 友善的虎斑貓       |
| **Rare**      | Siamese Princess | 優雅的暹羅貓，藍色眼睛 |
| **Epic**      | Maine Coon King  | 威嚴的緬因貓，王者風範 |
| **Legendary** | Cosmic Cat       | 神秘的宇宙貓，來自星空 |


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


---
## 🌐 部署（測試網）


---
## 🛠️ 故障排除


---
## 📚 參考資源

- [TON Blueprint](https://github.com/ton-org/blueprint)
- [TON Testnet Explorer](https://testnet.tonviewer.com/)
- [Tact 語言文檔](https://docs.tact-lang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/)