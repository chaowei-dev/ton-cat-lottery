# 🚀 TON Cat Lottery Backend

> TON 貓咪抽獎後端服務 - 基於 Go 語言的自動抽獎機器人

## 📋 專案結構

```
backend/
├── main.go                    # 主程序入口
├── go.mod                     # Go 模組定義
├── .env.example               # 環境變數範例
├── config/
│   └── config.go              # 配置管理
├── internal/
│   ├── lottery/               # 抽獎服務
│   │   └── service.go         # 完整抽獎邏輯與合約互動
│   ├── ton/                   # TON 區塊鏈客戶端
│   │   └── client.go          # TonCenter API 客戶端
│   ├── transaction/           # 交易監控
│   │   └── monitor.go         # 交易狀態監控與重試
│   └── wallet/                # 錢包管理
│       └── manager.go         # Ed25519 簽名與交易創建
├── pkg/
│   └── logger/                # 結構化日誌系統
│       └── logger.go
└── build/                     # 編譯產物
```

## ✨ 核心功能

### 🎯 智能合約互動

- **完整的 TON 區塊鏈互動**：支援 TonCenter API 調用
- **抽獎合約查詢**：狀態查詢、參與者資訊、中獎紀錄
- **自動抽獎執行**：條件檢查、交易發送、結果監控
- **錢包管理**：Ed25519 私鑰管理、交易簽名

### 🔧 已實現功能模組

#### 1. **TON 客戶端** (`internal/ton/client.go`)

- ✅ TonCenter API 基礎客戶端
- ✅ 合約 get 方法調用 (`RunGetMethod`)
- ✅ 交易發送與狀態查詢
- ✅ 抽獎合約專用查詢：
  - `GetLotteryContractInfo()` - 查詢抽獎狀態
  - `GetParticipant()` - 查詢參與者資訊
  - `GetWinner()` - 查詢中獎記錄
  - `GetContractBalance()` - 查詢合約餘額

#### 2. **錢包管理** (`internal/wallet/manager.go`)

- ✅ 支援 32/64 字節私鑰載入
- ✅ Ed25519 數位簽名
- ✅ TON 交易創建與簽名
- ✅ 專用交易創建方法：
  - `CreateDrawWinnerTransaction()` - 抽獎交易
  - `CreateStartNewRoundTransaction()` - 新輪次交易
  - `CreateSetNFTContractTransaction()` - NFT 合約設定

#### 3. **抽獎服務** (`internal/lottery/service.go`)

- ✅ 自動抽獎定時器與條件檢查
- ✅ 完整抽獎流程控制
- ✅ 核心抽獎功能：
  - `SendDrawWinner()` - 執行抽獎
  - `SendStartNewRound()` - 開始新輪次
  - `GetContractInfo()` - 合約狀態查詢
- ✅ 服務狀態管理與優雅關閉

#### 4. **交易監控** (`internal/transaction/monitor.go`)

- ✅ 交易狀態實時監控
- ✅ 自動重試機制
- ✅ 超時處理與錯誤恢復
- ✅ 交易確認與結果回報

## ⚙️ 環境設置

### 1. **複製環境變數範例**

```bash
cp .env.example .env
```

### 2. **環境變數配置**

必需配置項目：

```bash
# TON 網路配置
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2/
TON_NETWORK=testnet

# 智能合約地址
LOTTERY_CONTRACT_ADDRESS=EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NFT_CONTRACT_ADDRESS=EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 錢包配置（選擇其中一種）
WALLET_PRIVATE_KEY=your_private_key_hex    # 32或64字節私鑰
# 或
WALLET_MNEMONIC=your_mnemonic_phrase

# 抽獎參數
DRAW_INTERVAL=30m           # 抽獎檢查間隔
MAX_PARTICIPANTS=10         # 最大參與人數
MIN_PARTICIPANTS=2          # 最小參與人數
ENTRY_FEE_TON=0.1          # 參與費用
AUTO_DRAW=true             # 是否自動抽獎
```

可選配置項目：

```bash
# 服務配置
ENVIRONMENT=development
LOG_LEVEL=info
PORT=8080

# 重試配置
RETRY_COUNT=3
RETRY_DELAY=5s
```

## 🛠️ 開發指令

### 基本開發流程

```bash
# 1. 安裝依賴
go mod tidy

# 2. 編譯檢查
go build -v ./...

# 3. 編譯專案
go build -o build/lottery-backend .

# 4. 運行服務
./build/lottery-backend

# 或直接運行
go run .
```

### 開發工具指令

```bash
# 代碼格式化
go fmt ./...

# 代碼檢查
go vet ./...

# 運行測試
go test ./...

# 查看依賴
go mod graph

# 清理無用依賴
go mod tidy
```

## 🚀 使用說明

### 啟動服務

1. **配置環境變數**：確保 `.env` 文件包含所有必要配置
2. **啟動服務**：`go run .` 或編譯後執行
3. **服務監控**：觀察日誌輸出，確認各模組正常啟動

### 服務功能

- **自動抽獎**：服務會定期檢查合約狀態，滿足條件時自動執行抽獎
- **手動控制**：可通過程式碼調用 `SendDrawWinner()` 手動觸發抽獎
- **狀態查詢**：即時查詢合約狀態、參與者資訊、中獎紀錄
- **交易監控**：自動監控所有發送的交易，確保執行成功

### 日誌輸出

服務運行時會輸出結構化日誌：

```
{"time":"2025-08-01T14:40:33+08:00","level":"INFO","msg":"🚀 TON Cat Lottery Backend 啟動中..."}
{"time":"2025-08-01T14:40:33+08:00","level":"INFO","msg":"錢包載入成功","wallet":{"address":"EQxxxx"}}
{"time":"2025-08-01T14:40:33+08:00","level":"INFO","msg":"✅ 抽獎服務啟動成功"}
```

## 🔧 API 接口

### 服務狀態查詢

```go
// 獲取服務運行狀態
status := lotteryService.GetStatus()

// 獲取合約狀態
contractInfo, err := lotteryService.GetContractInfo()

// 獲取錢包地址
address := lotteryService.GetWalletAddress()
```

### 抽獎操作

```go
// 手動執行抽獎
err := lotteryService.SendDrawWinner()

// 開始新輪次
err := lotteryService.SendStartNewRound()

// 查詢中獎記錄
winner, err := lotteryService.GetWinner(roundNumber)
```

## 🐛 故障排除

### 常見問題

1. **錢包載入失敗**

   - 檢查私鑰格式是否正確（32 或 64 字節十六進制）
   - 確認環境變數設置正確

2. **合約查詢失敗**

   - 驗證合約地址格式
   - 檢查 TON 網路連接
   - 確認 API endpoint 可訪問

3. **交易發送失敗**
   - 檢查錢包餘額是否足夠
   - 驗證合約方法是否存在
   - 查看詳細錯誤日誌

### 調試模式

設置 `LOG_LEVEL=debug` 獲取詳細日誌：

```bash
export LOG_LEVEL=debug
go run .
```

## 📊 技術架構

- **語言**：Go 1.24+
- **區塊鏈**：TON (The Open Network)
- **加密**：Ed25519 數位簽名
- **API**：TonCenter REST API
- **日誌**：結構化 JSON 日誌
- **配置**：環境變數管理
