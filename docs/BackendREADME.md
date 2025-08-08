# 🚀 TON Cat Lottery Backend

> TON 貓咪抽獎後端服務 - 基於 Go 語言的自動抽獎機器人

## 📋 目錄

---
## 🎯 項目概覽

TON Cat Lottery Backend 是一個基於 Go 的智能抽獎守護進程，專注於自動化監聽和管理 TON 區塊鏈上的貓咪 NFT 抽獎系統。

### 🤖 **核心功能**

**自動監聽系統**
- 實時監聽 CatLottery 智能合約的狀態變化
- 雙重保障機制：WebSocket 事件監聽 + 定時輪詢檢查
- 當參與人數達到 3 人時自動觸發抽獎

**抽獎自動化**  
- 自動執行 drawWinner 交易，選出中獎者
- 監控抽獎交易執行狀態，確保成功完成
- 抽獎完成後自動開始新輪次，實現無縫循環

**智能合約整合**
- 與 CatLottery.tact 合約深度整合
- 支持完整的抽獎生命周期管理
- 處理合約事件和狀態同步

### 🏗️ **技術架構**

**服務設計**
- 守護進程模式，24/7 持續運行
- 模組化設計，易於擴展和維護  
- 完整的錯誤處理和重試機制

**區塊鏈交互**
- TON 區塊鏈客戶端集成
- 錢包管理和交易簽名
- 交易監控和確認機制

**可靠性保障**
- 雙重監聽防止事件遺漏
- 自動重試機制處理網路異常
- 完整的日誌記錄和監控

### 🎯 **使用場景**

1. **用戶參與抽獎** → 前端直接與合約互動，後端監聽狀態
2. **自動抽獎觸發** → 人數達標時後端自動執行抽獎  
3. **NFT 自動發送** → 合約內建 NFT 發送，後端確保流程完整
4. **輪次自動管理** → 自動開始新輪次，維持系統持續運行



---
## 🔄 系統架構與模組流程

### 📊 **整體架構**

```
                    後端守護進程架構
                         
┌─────────────────┐                           ┌─────────────────┐
│   用戶前端       │                           │  TON 區塊鏈     │
│   (React)       │◄─────── TON Connect ─────▶│   智能合約       │
└─────────────────┘          直接互動          └─────────────────┘
                                                       ▲
                                                       │
                                                合約狀態與事件
                                                       │
                                                       ▼
                                            ┌─────────────────┐
                                            │   後端守護進程   │
                                            │  (Go Service)   │
                                            │   獨立監聽      │
                                            └─────────────────┘
                                                       │
                                                 自動化操作：
                                               • 監聽合約事件
                                               • 自動觸發抽獎
                                               • 管理輪次循環
```

**架構說明**：
- **前端 ↔ 智能合約**: 用戶直接通過 TON Connect 與合約互動，無需經過後端
- **後端守護進程**: 完全獨立運行，專職監聽合約狀態並執行自動化任務
- **後端 → 智能合約**: 單向操作，只負責發送 drawWinner 和 startNewRound 交易

### 🎯 **核心模組流程**

#### **模組 1: 合約監聽系統**
```go
// 雙重監聽策略
type Monitor struct {
    EventListener  *EventListener  // WebSocket 實時事件監聽 
    PollingChecker *PollingChecker // 30秒定時狀態檢查
    ContractAddr   string          // CatLottery 合約地址
}

監聽流程:
用戶參與抽獎 → 合約記錄參與者 → 觸發 ParticipantJoined 事件
                ↓
參與人數達 3 人 → 合約觸發 LotteryFull 事件 → 停止接受新參與者
                ↓
後端監聽到事件 → 驗證合約狀態 → 觸發自動抽獎流程
```

#### **模組 2: 自動抽獎觸發器**
```go
// 自動抽獎核心邏輯
func (s *LotteryService) OnLotteryFull(event LotteryFullEvent) {
    // 1. 驗證合約狀態
    // 2. 創建 drawWinner 交易  
    // 3. 發送交易並監控結果
    // 4. 監聽後續 WinnerDrawn 事件
}

執行流程:
監聽到條件達成 → 創建 drawWinner 交易 → 發送至 CatLottery 合約
                ↓
合約執行抽獎邏輯 → 選出中獎者 → 自動調用 sendNFT() → 發送至 CatNFT 合約  
                ↓
觸發 WinnerDrawn 事件 → 觸發 NFTSent 事件 → 合約重置狀態
```

#### **模組 3: 輪次管理系統**  
```go
// 新輪次自動啟動
func (s *LotteryService) OnWinnerDrawn(event WinnerDrawnEvent) {
    // 1. 記錄中獎結果
    // 2. 等待 NFT 發送確認
    // 3. 創建 startNewRound 交易
    // 4. 重新啟動監聽循環
}

管理流程:
WinnerDrawn 事件接收 → 確認抽獎完成 → 發送 startNewRound 交易
                ↓
合約重新開放參與 → 重置參與者計數 → 輪次遞增 → 開始新循環
```

#### **模組 4: 交易管理系統**
```go
// 交易監控與重試
type TransactionMonitor struct {
    RetryCount    int           // 最大重試次數 (3次)
    RetryDelay    time.Duration // 重試間隔
    ConfirmTimeout time.Duration // 確認超時時間 (5分鐘)  
}

監控流程:
交易發送 → 監控確認狀態 → 成功/失敗/超時處理 → 重試機制 → 最終結果記錄
```

### ⚡ **關鍵技術特點**

#### **1. 雙重監聽保障**
```go
// 並行監聽實現
go s.eventListener()  // WebSocket 事件監聽 (1-5秒響應)
go s.pollingChecker() // 定時輪詢檢查 (30秒間隔，防遺漏)
```
- **主要策略**: WebSocket 實時監聽合約事件
- **保底策略**: 定時輪詢合約狀態，確保不遺漏任何變化
- **容錯機制**: 網路異常時自動切換到輪詢模式

#### **2. 事件驅動架構**  
```go
// 事件處理器
type EventHandler struct {
    OnParticipantJoined func(ParticipantJoinedEvent)
    OnLotteryFull      func(LotteryFullEvent)      // 觸發抽獎
    OnWinnerDrawn      func(WinnerDrawnEvent)      // 開始新輪次  
    OnNFTSent          func(NFTSentEvent)          // 記錄發送結果
}
```

#### **3. 自動化流程控制**
- **狀態機設計**: 嚴格控制抽獎各階段轉換
- **原子操作**: 確保每個步驟要麼完全成功，要麼完全失敗
- **冪等性**: 重複執行相同操作不會產生副作用

#### **4. 可靠性機制**
```go
// 錯誤處理與重試
type RetryPolicy struct {
    MaxRetries    int           // 3次重試
    BackoffDelay  time.Duration // 指數退避延遲
    CircuitBreaker bool         // 熔斷器保護
}
```

#### **5. 模組化設計**
```
internal/
├── events/          # 事件監聽和處理
├── lottery/         # 抽獎服務核心邏輯  
├── ton/            # TON 區塊鏈客戶端
├── transaction/    # 交易監控和管理
├── wallet/         # 錢包和簽名管理
└── config/         # 配置管理
```

### 🔄 **完整運行周期**
```
系統啟動 → 監聽合約 → 用戶參與 → 達到3人 → 自動抽獎 → NFT發送 → 新輪次 
    ↑                                                                  │
    └────────────────── 自動循環，無需人工干預 ─────────────────────────────┘
```

---
## 🚀 快速開始


---
## 🌐 部署（測試網）


---
## 🛠️ 故障排除