# 🐳 TON Cat Lottery Docker 部署指南

本專案使用 Docker Compose 統一管理後端服務和前端應用。

## 📋 服務架構

- **backend**: Go 語言後端服務 (抽獎邏輯)
- **frontend**: React + Vite 前端應用
- **frontend-dev**: 前端開發服務 (可選)
- **monitor**: Prometheus 監控服務 (可選)

### 📜 智能合約部署

合約需要在運行 Docker 服務之前先部署完成。請參考主 README.md 中的合約部署說明。

## 🎯 DevOps 最佳實踐展現

本專案的 Docker 配置展現了多項 DevOps 核心技能和最佳實踐：

### 1. **環境隔離 (Environment Isolation)**

```yaml
# 生產 Production 環境：最佳化部署
frontend:
  target: production # Nginx 靜態文件服務
  ports: ['3000:80'] # 標準 HTTP 端口

# 開發 Development 環境：開發者友好
frontend-dev:
  target: development # Vite 熱重載服務
  ports: ['5173:5173'] # 開發端口
  volumes: ['./frontend:/app'] # 即時代碼同步
```

**價值展現**：

- ✅ 生產和開發環境完全分離
- ✅ 不同環境使用不同的最佳化策略
- ✅ 避免環境差異導致的部署問題

### 2. **多階段構建 (Multi-stage Build)**

```dockerfile
# Frontend Dockerfile 展現的構建策略：
FROM node:22.18.0-alpine AS base     # 基礎環境
FROM base AS deps                    # 生產依賴
FROM base AS deps-dev                # 開發依賴
FROM deps-dev AS builder             # 應用構建
FROM nginx:alpine AS production      # 生產部署
FROM deps-dev AS development         # 開發模式
```

**技能展現**：

- ✅ 最佳化鏡像大小 (生產環境不包含開發依賴)
- ✅ 構建時間優化 (分層快取)
- ✅ 安全最佳實踐 (最小化攻擊面)

### 3. **Infrastructure as Code (IaC)**

```yaml
# 通過 Docker Compose 管理基礎設施
services:
  backend: { ... }
  frontend: { ... }
  frontend-dev:
    profiles: [development] # 開發模式
  monitor:
    profiles: [monitoring]  # 監控模式
```

**展現價值**：

- ✅ 基礎設施版本控制
- ✅ 可重現的部署環境
- ✅ 聲明式配置管理

### 4. **配置管理和環境變數策略**

```bash
# 環境特定配置
ENVIRONMENT=development|production
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error

# 安全配置管理
WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY:-default}
TON_NETWORK=${TON_NETWORK:-testnet}
```

**最佳實踐**：

- ✅ 配置外部化 (12-Factor App)
- ✅ 敏感資料安全處理
- ✅ 環境特定的預設值

### 5. **服務編排和網路管理**

```yaml
networks:
  ton-lottery-network:
    driver: bridge
    name: ton-lottery-network

# 服務間通信
environment:
  - VITE_BACKEND_URL=http://backend:8080 # 內部服務發現
```

**技能展現**：

- ✅ 微服務架構設計
- ✅ 服務發現和內部通信
- ✅ 網路隔離和安全

### 6. **可觀測性和監控**

```yaml
# 健康檢查
healthcheck:
  test: ['CMD', 'curl', '-f', 'http://localhost:80/health']
  interval: 30s
  timeout: 10s
  retries: 3

# Prometheus 監控
monitor:
  image: prom/prometheus:latest
  profiles: [monitoring]
```

**監控策略**：

- ✅ 應用健康檢查
- ✅ 指標收集 (Prometheus)
- ✅ 可選監控部署

## 🚀 DevOps 工作流展現

### 開發流程

```bash
# 👨‍💻 開發者本地環境
docker-compose --profile development up -d
# ↳ 啟動熱重載、代碼同步、即時反饋
```

### 測試部署

```bash
# 🧪 測試環境 (模擬生產)
docker-compose up -d
# ↳ 生產級別的容器配置
```

### 生產部署

```bash
# 🌐 生產環境
docker-compose up -d
# ↳ 最佳化、安全、可擴展
```

### 監控部署

```bash
# 📊 監控和可觀測性
docker-compose --profile monitoring up -d
# ↳ 額外的監控服務
```

## 💼 技能展現清單

### 容器化專業知識

- [x] **Multi-stage builds** - 最佳化構建流程
- [x] **Image optimization** - 最小化鏡像大小
- [x] **Security practices** - 非 root 用戶、最小權限

### 環境管理

- [x] **Environment separation** - 開發/生產分離
- [x] **Configuration management** - 環境變數外部化
- [x] **Secret management** - 敏感資料處理

### 服務編排

- [x] **Docker Compose** - 多服務管理
- [x] **Service networking** - 內部通信和發現
- [x] **Health checks** - 服務可用性監控

### 可觀測性

- [x] **Monitoring integration** - Prometheus 整合
- [x] **Health endpoints** - 健康檢查 API
- [x] **Logging strategy** - 日誌收集和管理

### 開發者體驗

- [x] **Hot reload support** - 即時代碼更新
- [x] **Volume mounting** - 開發時代碼同步
- [x] **Fast iteration** - 快速開發迭代

### Infrastructure as Code

- [x] **Declarative configuration** - YAML 聲明式配置
- [x] **Version controlled infrastructure** - 基礎設施版本化
- [x] **Reproducible deployments** - 可重現部署

## 📈 價值

這個 Docker 配置在展現的價值：

### 1. **容器化思維**

> "設計了多階段構建來最佳化生產鏡像，開發環境支援熱重載提升開發體驗"

### 2. **環境管理策略**

> "通過 Docker Compose profiles 實現環境分離，確保開發和生產環境的一致性"

### 3. **可觀測性設計**

> "整合了 Prometheus 監控和健康檢查，確保服務可用性和問題快速發現"

### 4. **安全意識**

> "使用非 root 用戶運行容器，配置外部化管理敏感資料"

### 5. **開發者體驗**

> "設計了開發者友好的工作流，支援熱重載和即時反饋"

這個配置展現了完整的 DevOps 思維和現代容器化最佳實踐！🌟

## 🚀 快速開始

### 1. 環境準備

```bash
# 克隆專案
git clone <repository-url>
cd ton-cat-lottery

# 創建並配置環境變數檔案
cp .env.example .env
```

### 2. 環境變數配置

創建 `.env` 檔案並設定以下必要環境變數：

```bash
# ================================
# ====== 全域配置 ======
# ================================
# 環境：development, staging, production
ENVIRONMENT=development

# 日誌等級：debug, info, warn, error
LOG_LEVEL=info

# ================================
# ====== 後端服務配置 ======
# ================================

# ====== 服務基礎配置 ======
ENVIRONMENT=development
LOG_LEVEL=info
PORT=8080

# ====== TON 區塊鏈配置 ======
# TON API 端點 (testnet/mainnet)
TON_API_ENDPOINT=https://testnet.toncenter.com/api/v2/
TON_NETWORK=testnet

# ====== 智能合約地址 ======
# 抽獎合約地址 (測試用)
LOTTERY_CONTRACT_ADDRESS=EQBMegbDGejjYeIutXneUvYvWfJMpS71b11kJLaNKFnP_6Jh

# NFT 合約地址 (測試用)  
NFT_CONTRACT_ADDRESS=EQDGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8H

# ====== 錢包配置 ======
# 測試用私鑰
WALLET_PRIVATE_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# ====== 抽獎參數配置 ======
# 抽獎間隔
DRAW_INTERVAL=5m

# 參與人數限制
MAX_PARTICIPANTS=3
MIN_PARTICIPANTS=1

# 參與費用 (TON)
ENTRY_FEE_TON=0.01

# 是否自動抽獎
AUTO_DRAW=false

# ====== 重試機制配置 ======
RETRY_COUNT=3
RETRY_DELAY=5s
```

### 3. 啟動服務

#### 生產環境 (推薦)

```bash
# 啟動後端和前端服務
docker-compose up --build -d
```

#### 開發環境

```bash
# 啟動後端和前端開發服務 (前端熱重載)
docker-compose --profile development up --build -d

# 或者只啟動後端，前端使用開發模式
docker-compose up --build -d backend frontend-dev
```

#### 包含監控

```bash
# 啟動所有服務包括 Prometheus 監控
docker-compose --profile monitoring up --build -d
```

## 📊 服務訪問

- **前端應用**: http://localhost:3000
- **前端開發**: http://localhost:5173 (開發模式)
- **後端服務**: http://localhost:8080
- **Prometheus**: http://localhost:9090 (監控模式)

## 🛠 實用指令

### 查看服務狀態

```bash
docker-compose ps
```

### 查看服務日誌

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 進入容器

```bash
# 進入後端容器
docker-compose exec backend sh

# 進入前端容器
docker-compose exec frontend sh
```

### 重啟服務

```bash
# 重啟特定服務
docker-compose restart backend
docker-compose restart frontend

# 重啟所有服務
docker-compose restart
```

### 停止和清理

```bash
# 停止所有服務
docker-compose down

# 停止並刪除數據卷
docker-compose down -v

# 停止並刪除鏡像
docker-compose down --rmi all
```

### 重新構建

```bash
# 重新構建特定服務
docker-compose build --no-cache backend
docker-compose build --no-cache frontend

# 重新構建並啟動
docker-compose up --build -d
```

## 🔍 故障排除

### 常見問題

2. **後端連接 TON 網路失敗**

   ```bash
   # 檢查網路配置
   echo $TON_API_ENDPOINT
   echo $TON_NETWORK

   # 檢查後端日誌
   docker-compose logs backend
   ```

3. **前端無法連接後端**

   ```bash
   # 檢查環境變數
   echo $VITE_BACKEND_URL

   # 確認服務間網路連通性
   docker-compose exec frontend ping backend
   ```

4. **端口衝突**

   ```bash
   # 檢查端口使用情況
   lsof -i :3000
   lsof -i :8080
   lsof -i :5173

   # 修改 docker-compose.yml 中的端口映射
   ```

### 健康檢查

```bash
# 檢查所有服務健康狀態
docker-compose ps

# 手動健康檢查
curl -f http://localhost:3000/health    # 前端
curl -f http://localhost:5173/         # 前端開發
```

### 數據持久化

數據卷位置：

- 後端日誌: `backend-logs` 卷

### 性能優化

```bash
# 清理未使用的 Docker 資源
docker system prune -a

# 查看資源使用情況
docker stats
```

## 📝 環境差異

### 開發環境 vs 生產環境

| 配置項        | 開發環境   | 生產環境   |
| ------------- | ---------- | ---------- |
| TON_NETWORK   | testnet    | mainnet    |
| LOG_LEVEL     | debug      | warn       |
| AUTO_DRAW     | false      | true       |
| DRAW_INTERVAL | 5m         | 30m        |
| ENTRY_FEE_TON | 0.1        | 1.0        |
| 前端模式      | 開發服務器 | Nginx 靜態 |

### 部署檢查清單

- [ ] 先部署智能合約 (參考主 README.md)
- [ ] 在 .env 中設定合約地址
- [ ] 設定正確的 TON 網路
- [ ] 配置安全的錢包私鑰
- [ ] 調整抽獎參數
- [ ] 設定正確的前端 API URL
- [ ] 驗證所有服務健康狀態
- [ ] 測試端到端功能
