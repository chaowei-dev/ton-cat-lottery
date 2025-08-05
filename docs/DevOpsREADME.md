# DevOps 相關說明

## 目錄
- [Docker](#docker)
- [GCP-設定](#gcp-設定)
- [Terraform](#terraform)
- [k8s GKE](#k8s-gke)
- [GitHub Action (CI/CD)](#github-action-cicd)

---
## Docker
### 架構
- **backend**: Go 語言後端服務 (抽獎邏輯)
- **frontend**: React + Vite 前端應用
- **frontend-dev**: 前端開發服務 (可選)
- **monitor**: Prometheus 監控服務 (可選)

### 簡介
TON Cat Lottery 使用 Docker 容器化部署，提供一致的開發和生產環境。專案採用多服務架構，使用 Docker Compose 統一管理所有服務的啟動、網路和環境配置。

**主要特色：**
- 多環境支援：生產、開發、監控環境
- 熱重載：前端開發模式支援即時編輯
- 網路隔離：所有服務運行在獨立的 Docker 網路中
- 健康檢查：自動監控服務狀態
- 環境變數管理：安全的配置管理

### 檔案結構
```
ton-cat-lottery/
├── docker/
│   ├── Dockerfile.backend      # Go 後端服務容器配置
│   └── Dockerfile.frontend     # React 前端應用容器配置
├── docker-compose.yml          # 服務編排配置
├── .env.example               # 環境變數範例
└── .env                       # 實際環境變數 (需自行建立)
```



### 快速啟動
**環境設定**
在啟動services前，需要先設定環境變數：

```bash
# 1. 複製環境變數範例檔案
cp .env.example .env

# 2. 編輯 .env 檔案，填入必要配置
vim .env  # 或使用其他編輯器
```

**必填環境變數**
- `LOTTERY_CONTRACT_ADDRESS`: 抽獎合約地址
- `NFT_CONTRACT_ADDRESS`: NFT 合約地址  
- `WALLET_PRIVATE_KEY`: 後端服務錢包私鑰

**指令**
```bash
# 生產環境
# 啟動後端和前端服務
docker-compose up --build -d

# 開發環境
# 啟動開發服務 (前端熱重載)
docker-compose --profile development up --build -d

# 包含監控
# 啟動所有服務包括 Prometheus 監控
docker-compose --profile monitoring up --build -d
```

**服務訪問**
- **前端應用**: http://localhost:3000
- **前端開發**: http://localhost:5173 (開發模式)
- **後端服務**: http://localhost:8080

### 常用指令
```bash
# 查看服務狀態
docker-compose ps

# 查看服務日誌
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# 進入容器
docker-compose exec backend sh
docker-compose exec frontend sh

# 重啟服務
docker-compose restart backend
docker-compose restart frontend

# 停止和清理
docker-compose down
docker-compose down -v  # 刪除數據卷
docker-compose down --rmi all  # 刪除鏡像

# 重新構建
docker-compose build --no-cache backend
docker-compose up --build -d
```

### 故障排除
```bash
# 檢查端口使用情況
lsof -i :3000
lsof -i :8080
lsof -i :5173

# 終止佔用進程
sudo kill -9 <PID>

# 手動健康檢查
curl -f http://localhost:3000/health
curl -f http://localhost:5173/

# 清理未使用的 Docker 資源
docker system prune -a

# 查看資源使用情況
docker stats

# 檢查容器狀態詳情
docker-compose ps -a

# 查看容器啟動錯誤
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend

# 檢查 .env 檔案配置
cat .env

# 測試網路連接
docker-compose exec backend ping frontend
docker-compose exec frontend ping backend

# 檢查環境變數
docker-compose exec backend env | grep -E "(TON|LOTTERY|NFT|WALLET)"

# 驗證環境變數載入
docker-compose config

# 重置整個環境
docker-compose down -v --remove-orphans
docker-compose up --build -d
```


---
## GCP 設定
### 簡介

### 檔案結構

### 快速啟動

### 常用指令

### 故障排除


---
## Terraform
### 簡介

### 檔案結構

### 快速啟動

### 常用指令

### 故障排除

---
## k8s GKE
### 簡介

### 檔案結構

### 快速啟動

### 常用指令

### 故障排除

---
## GitHub Action (CI/CD)
### 簡介

### 檔案結構

### 快速啟動

### 常用指令

### 故障排除