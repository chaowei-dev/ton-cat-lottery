# 🚀 TON Cat Lottery Backend

> TON 貓咪抽獎後端服務 - 基於 Go 語言的自動抽獎守護進程

## 📋 目錄

- [🎯 項目概覽](#-項目概覽)
- [🔄 核心流程](#-核心流程)
- [🛡️ 保障機制](#-保障機制)
- [🚀 快速開始](#-快速開始)
- [📦 部署配置](#-部署配置)
- [🛠️ 故障排除](#️-故障排除)
- [📚 參考資源](#-參考資源)

---
## 🎯 項目概覽

TON Cat Lottery Backend 是一個基於 Go 的智能抽獎守護進程，專注於自動化監聽和管理 TON 區塊鏈上的貓咪 NFT 抽獎系統。

### 🤖 **核心功能**

> **簡化核心**: 後端只做一件事 - 自動化執行 `drawWinner`
> - ✅ **監聽 `lotteryActive` 狀態** (從 `true` 變為 `false` 時)
> - ✅ **自動觸發 `drawWinner`** (取代手動操作)
> - ✅ **等待合約自動完成** (NFT mint + 新輪次啟動)

#### **1. 核心監聽邏輯**
- **監聽目標**: `lotteryActive` 狀態 (從 `true` → `false`)
- **觸發時機**: 合約滿員時自動設為 `lotteryActive = false`
- **檢查方式**: 每 30 秒輪詢 `getContractInfo()` 獲取狀態
- **簡單條件**: `lotteryActive == false` && `drawInProgress == false`

#### **2. 自動執行 drawWinner**
- **發送交易**: 使用後端 owner 錢包自動發送 `drawWinner`
- **Gas 費用**: 0.2 TON (含 NFT mint 費用)
- **餘額檢查**: 執行前確認錢包餘額 >= 0.3 TON
- **一次性執行**: 發送後等待合約自動完成整個流程

#### **3. 等待合約自動化**
- **合約自動**: `drawWinner` → NFT mint → `WinnerConfirmed` → `NewRoundStarted`
- **狀態重置**: `NewRoundStarted` 後，`lotteryActive` 重新變為 `true`
- **循環監聽**: 回到步驟1，繼續監聽下一輪

#### **4. 必要的保障機制**
- **交易監控**: 追蹤 `drawWinner` 交易狀態，失敗時重試
- **餘額告警**: 錢包餘額低於 1 TON 時發送告警
- **超時處理**: 檢測 `drawInProgress` 超時，調用 `resetDrawStateIfTimeout`
- **重複防護**: 追蹤已處理的輪次，避免重複觸發
- **故障恢復**: API 失敗時退避重試，服務重啟後狀態恢復

### 🎯 **設計原則**

- **最小化干預**: 後端只做狀態監聽和交易觸發
- **依賴合約邏輯**: 所有業務邏輯由智能合約處理
- **故障自恢復**: 具備基本的重試和異常處理機制

---
## 🔄 核心流程

### 📊 **架構**

```
前端用戶 ──TON Connect──→ 智能合約 ←── 狀態監聽 ──→ 後端服務
   │                        │                      │
   └── 參與抽獎              └── 自動化流程           └── 觸發 drawWinner
```

### 🔄 **核心步驟**

#### **1. 狀態監聽**
```
每 30 秒輪詢 getContractInfo()
   │
   ▼
檢查條件:
   ├── lotteryActive == false
   ├── drawInProgress == false  
   ├── 輪次未處理過
   └── 錢包餘額足夠
```

#### **2. 觸發抽獎**
```
條件滿足 → 發送 drawWinner (0.2 TON)
   │
   ▼
監控交易:
   ├── 成功 → 記錄已處理
   └── 失敗 → 重試 (3次)
```

#### **3. 等待合約自動化**
```
合約自動: 抽獎 → NFT mint → 新輪次
   │
   ▼
lotteryActive 變為 true → 回到步驟 1
```

---
## 🛡️ 保障機制

#### **1. 交易重試**
- **指數退避**: 30s → 60s → 120s
- **最大重試**: 3次
- **失敗類型**: 網路錯誤重試，邏輯錯誤停止

#### **2. 餘額監控**  
- **低餘額告警**: < 1 TON
- **交易前檢查**: >= 0.3 TON
- **緊急停止**: 餘額不足時自動停止

#### **3. 超時處理**
- **超時檢測**: drawInProgress > 5分鐘
- **自動恢復**: 調用 resetDrawStateIfTimeout
- **狀態重置**: 恢復正常監聽

#### **4. 重複防護**
- **輪次追蹤**: 記錄已處理輪次
- **去重檢查**: 避免重複觸發
- **狀態一致性**: 定期與合約同步

#### **5. 服務可用性**
- **API 失敗重試**: 退避策略
- **服務重啟**: 狀態恢復
- **健康檢查**: 自動監控

---
## 🚀 快速開始


---
## 📦 部署配置


---
## 🛠️ 故障排除

---
## 📚 參考資源

### 🔗 **官方文檔**
- [TON 區塊鏈官方文檔](https://docs.ton.org/)
- [TON Connect 文檔](https://docs.ton.org/develop/dapps/ton-connect/)
- [TON API 文檔](https://tonapi.io/docs)
- [Tact 語言文檔](https://docs.tact-lang.org/)

### 📖 **技術參考**
- [Go 語言官方文檔](https://golang.org/doc/)
- [Go 併發模式](https://golang.org/doc/effective_go.html#concurrency)
- [Docker 最佳實踐](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes 部署指南](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

### 🛠️ **開發工具**
- [Visual Studio Code Go 擴展](https://marketplace.visualstudio.com/items?itemName=golang.Go)
- [Delve 除錯器](https://github.com/go-delve/delve)
- [GoLand IDE](https://www.jetbrains.com/go/)
- [TON 瀏覽器 (測試網)](https://testnet.tonviewer.com/)

### 📊 **監控工具**
- [Prometheus 監控系統](https://prometheus.io/docs/)
- [Grafana 可視化平台](https://grafana.com/docs/)
- [AlertManager 告警管理](https://prometheus.io/docs/alerting/latest/alertmanager/)

### 🔐 **安全資源**
- [Go 安全編程指南](https://github.com/Checkmarx/Go-SCP)
- [容器安全最佳實踐](https://sysdig.com/blog/dockerfile-best-practices/)
- [Kubernetes 安全指南](https://kubernetes.io/docs/concepts/security/)