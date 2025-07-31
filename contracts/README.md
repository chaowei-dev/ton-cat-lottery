# 🐱 TON Cat Lottery - 智能合約

TON Cat Lottery 智能合約實現，使用 Tact 語言開發。

## 📦 功能特色

- ✅ **參加抽獎** - 用戶支付 TON 參與抽獎
- ✅ **隨機抽獎** - 基於區塊哈希的公平隨機機制
- ✅ **NFT 發送** - 自動發送貓咪 NFT 給中獎者
- ✅ **輪次管理** - 支援多輪抽獎
- ✅ **資金管理** - 安全的資金提取機制
- ✅ **事件記錄** - 完整的鏈上事件日誌

## 🛠️ 環境需求

```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

## 🚀 快速開始

### 1️⃣ 安裝依賴

```bash
cd contracts
npm install
```

### 2️⃣ 編譯合約

```bash
npm run build
```

### 3️⃣ 驗證編譯結果

```bash
npm run verify
```

### 4️⃣ 運行測試

```bash
npm run test
```

### 5️⃣ 部署到測試網

```bash
npm run deploy:testnet
```

## 📋 詳細指令說明

### 安裝和設置

```bash
# 安裝所有依賴
npm install

# Tact CLI 已包含在項目依賴中，無需全局安裝

# 驗證編譯器
npx tact --version
```

### 編譯合約

```bash
# 編譯 Tact 合約
npm run build

# 編譯後的文件位於 build/ 目錄
ls build/
```

### 測試合約

```bash
# 運行主要測試
npm run test

# 運行所有測試
npm run test:all

# 運行測試並觀察變化
npm run test:watch

# 驗證合約編譯結果
npm run verify
```

### 驗證編譯

```bash
# 檢查編譯結果和合約功能
npm run verify

# 手動檢查編譯輸出
ls build/
cat build/CatLottery_CatLottery.abi
```

### 部署合約

#### 部署到測試網

```bash
# 使用腳本部署
npm run deploy:testnet

# 注意：需要先配置錢包助記詞
```

#### 部署到主網

```bash
npm run deploy:mainnet
```

#### 自定義部署參數

創建 `.env` 文件：

```bash
# .env
DEPLOYER_MNEMONIC="your wallet mnemonic words here"
ENTRY_FEE=100000000  # 0.1 TON in nanoTON
MAX_PARTICIPANTS=10
NETWORK=testnet
```

然後部署：

```bash
npm run deploy:testnet
```

### 與合約互動

```bash
# 連接到已部署的合約
npx tsx scripts/interact.ts <CONTRACT_ADDRESS>

# 範例
npx tsx scripts/interact.ts EQC_CONTRACT_ADDRESS_HERE
```

## 🧪 測試覆蓋範圍

當前測試套件包含基本功能測試：

### ✅ 已測試功能

- **合約部署與初始化** - 驗證合約正確部署和參數設置
- **狀態查詢** - 測試 `getContractInfo()` 等查詢方法
- **餘額檢查** - 驗證合約餘額管理
- **邊界條件** - 測試不存在的參與者和中獎記錄查詢

### 🚧 待擴展測試

- 參加抽獎流程測試
- 抽獎功能測試
- 權限管理測試
- NFT 發送測試
- 錯誤處理測試

## 📊 合約架構

```
CatLottery.tact
├── 狀態變量
│   ├── owner           # 合約擁有者
│   ├── entryFee        # 參與費用
│   ├── maxParticipants # 最大參與人數
│   ├── participants    # 參與者映射
│   └── winners         # 中獎記錄
├── 核心功能
│   ├── join()          # 參加抽獎
│   ├── drawWinner()    # 進行抽獎
│   └── sendNFT()       # 發送 NFT
├── 管理功能
│   ├── setNFTContract  # 設定 NFT 合約
│   ├── startNewRound   # 開始新輪次
│   └── withdraw        # 提取資金
└── 查詢功能
    ├── getContractInfo # 合約狀態
    ├── getParticipant  # 參與者資訊
    └── getWinner       # 中獎記錄
```

## 🔧 自定義配置

### 修改合約參數

在 `scripts/deploy.ts` 中修改：

```typescript
const ENTRY_FEE = toNano('0.5'); // 參與費用
const MAX_PARTICIPANTS = 20; // 最大參與人數
```

### 修改隨機數算法

在 `CatLottery.tact` 中修改 `drawWinner()` 方法的隨機數生成邏輯。

## 🚨 安全注意事項

1. **隨機數安全性** - 目前使用區塊哈希，在生產環境建議使用更安全的隨機源
2. **權限管理** - 確保部署者錢包安全
3. **資金安全** - 定期提取合約資金
4. **NFT 合約驗證** - 確保 NFT 合約地址正確

## 📈 Gas 費用估算

| 操作     | 預估 Gas 費用 |
| -------- | ------------- |
| 部署合約 | ~1.0 TON      |
| 參加抽獎 | ~0.05 TON     |
| 進行抽獎 | ~0.1 TON      |
| NFT 發送 | ~0.05 TON     |
| 管理操作 | ~0.05 TON     |

## 🐛 故障排除

### 編譯錯誤

```bash
# 清理編譯文件
rm -rf build/
npm run build
```

### 測試失敗

```bash
# 檢查依賴
npm install
npm run test
```

### 部署失敗

```bash
# 檢查網路連接
ping testnet.toncenter.com

# 檢查錢包餘額
# 確保有足夠的 TON 支付部署費用
```