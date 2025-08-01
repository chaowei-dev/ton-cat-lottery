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
│   │   └── service.go
│   ├── ton/                   # TON 客戶端
│   │   └── client.go
│   └── wallet/                # 錢包管理
│       └── manager.go
├── pkg/
│   └── logger/                # 日誌系統
│       └── logger.go
└── build/                     # 編譯產物
```

## ⚙️ 環境設置

1. **複製環境變數範例**

   ```bash
   cp .env.example .env
   ```

2. **編輯 `.env` 文件，填入實際配置：**
   - TON 網路配置
   - 智能合約地址
   - 錢包私鑰或助記詞
   - 抽獎參數

## 🛠️ 開發指令

```bash
# 安裝依賴
go mod tidy

# 編譯專案
go build -o build/lottery-backend .

# 運行服務
./build/lottery-backend

# 或直接運行
go run .
```