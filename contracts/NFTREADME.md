# 🐱 TON Cat Lottery - 智能合約文檔

> 基於 TON 區塊鏈的貓咪 NFT 抽獎系統智能合約完整指南

---

## 📋 目錄

- [項目概覽](#項目概覽)
- [合約架構](#合約架構)
- [功能詳細說明](#功能詳細說明)
- [安裝與設置](#安裝與設置)
- [命令參考](#命令參考)
- [部署指南](#部署指南)
- [測試指南](#測試指南)
- [API 參考](#api-參考)
- [使用範例](#使用範例)
- [故障排除](#故障排除)

---

## 🎯 項目概覽

TON Cat Lottery 是一個完整的鏈上抽獎系統，包含兩個主要合約：

### 🎪 核心合約

1. **CatLottery.tact** - 主抽獎合約

   - 管理抽獎流程
   - 處理參與者註冊
   - 執行隨機抽獎
   - 自動發送 NFT 獎勵

2. **CatNFT.tact** - 貓咪 NFT 合約
   - 鑄造獨特的貓咪 NFT
   - 4 種稀有度等級
   - 完整的所有權管理
   - 轉移功能

### 🎨 NFT 稀有度系統

| 稀有度        | 名稱             | 描述                                |
| ------------- | ---------------- | ----------------------------------- |
| **Common**    | Orange Tabby     | 友善的橘色虎斑貓 (Tabby)            |
| **Rare**      | Siamese Princess | 優雅的暹羅貓 (Siamese)，藍色眼睛    |
| **Epic**      | Maine Coon King  | 威嚴的緬因貓 (Maine Coon)，王者風範 |
| **Legendary** | Cosmic Cat       | 神秘的宇宙貓 (Cosmic)，來自星空     |

---

## 🏗️ 合約架構

```
TON Cat Lottery 系統
├── CatLottery.tact          # 主抽獎邏輯
│   ├── 參與者管理
│   ├── 隨機抽獎機制
│   ├── NFT 發送集成
│   └── 事件日誌
│
└── CatNFT.tact             # NFT 管理
    ├── NFT 鑄造
    ├── 所有權轉移
    ├── 貓咪資訊查詢
    └── 合約管理
```

---

## 🔧 功能詳細說明

### CatLottery 合約功能

#### 🎯 核心抽獎功能

- **參與抽獎** (`join`): 支付 TON 參與當前輪次
- **執行抽獎** (`drawWinner`): 隨機選出中獎者
- **自動 NFT 發送**: 中獎後自動鑄造並發送 NFT

#### 👥 參與者管理

- **參與者儲存**: 記錄所有參與者地址和金額
- **重複檢查**: 防止同一地址重複參與
- **上限控制**: 達到最大參與人數自動關閉

#### 🎲 隨機機制

- **時間戳隨機**: 基於區塊時間戳
- **Gas 費用隨機**: 結合交易 Gas 費用
- **參與者數量**: 加入參與者數量作為隨機因子

#### 🏆 獎勵系統

- **NFT ID 生成**: 基於輪次和隨機數
- **貓咪類型選擇**: 隨機分配 4 種貓咪類型
- **自動發送**: 直接鑄造到中獎者錢包

### CatNFT 合約功能

#### 🎨 NFT 鑄造

- **基礎鑄造** (`mint`): 鑄造 NFT 給合約擁有者
- **指定鑄造** (`MintTo`): 鑄造 NFT 給指定地址
- **自動 ID 管理**: 自動分配遞增 NFT ID

#### 🔄 NFT 轉移

- **安全轉移** (`TransferNFT`): 驗證擁有者身份
- **事件日誌**: 記錄所有轉移操作
- **權限檢查**: 確保只有擁有者可以轉移

#### 📊 查詢功能

- **擁有者查詢**: 查詢特定 NFT 的擁有者
- **存在性檢查**: 檢查 NFT 是否存在
- **貓咪資訊**: 獲取貓咪的詳細資訊
- **合約狀態**: 查詢總供應量等信息

---

## 🚀 安裝與設置

### 系統需求

```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### 安裝步驟

1. **克隆項目**

```bash
git clone <your-repo-url>
cd ton-cat-lottery/contracts
```

2. **安裝依賴**

```bash
npm install
```

3. **驗證安裝**

```bash
npm run build
```

---

## 📋 命令參考

### 🔨 編譯命令

```bash
# 編譯所有合約
npm run build

# 等同於
tact --config ./tact.config.json
```

**輸出產物：**

- `build/CatLottery_CatLottery.*` - 抽獎合約編譯文件
- `build/CatNFT_CatNFT.*` - NFT 合約編譯文件

### 🧪 測試命令

```bash
# 運行所有測試
npm test
# 或
npm run test:all

# 運行特定測試文件
npm test -- tests/CatLottery.test.ts

# 監視模式運行測試
npm run test:watch
```

### 🚀 部署命令

#### 部署到測試網

```bash
# 部署抽獎合約
npm run deploy:testnet
# 或
npx ts-node scripts/deploy.ts --network testnet

# 部署 NFT 合約 (模板)
npx ts-node scripts/deploy-nft.ts
```

#### 部署到主網

```bash
# 部署抽獎合約
npm run deploy:mainnet
# 或
npx ts-node scripts/deploy.ts --network mainnet
```

### 🔍 驗證命令

```bash
# 驗證合約
npm run verify
# 或
npx tsx scripts/verify.ts
```

### 🎮 互動命令

```bash
# 與合約互動
npx ts-node scripts/interact.ts
```

### 🧹 清理命令

```bash
# 清理編譯產物
rm -rf build/*

# 重新編譯
npm run build
```

---

## 🚀 部署指南

### 步驟 1: 編譯合約

```bash
npm run build
```

### 步驟 2: 部署 NFT 合約

```bash
npx ts-node scripts/deploy-nft.ts
```

**輸出範例：**

```
🚀 部署 CatNFT 合約...
📦 部署者地址: EQABC...
📍 合約地址: EQDEF...
🔗 TON Explorer: https://testnet.tonviewer.com/EQDEF...
```

### 步驟 3: 部署抽獎合約

```bash
npm run deploy:testnet
```

### 步驟 4: 設定 NFT 合約地址

使用 `SetNFTContract` 消息將 NFT 合約地址設定到抽獎合約中。

### 步驟 5: 驗證部署

1. 在 TON Explorer 中檢查合約
2. 運行測試確認功能正常
3. 嘗試參與測試抽獎

---

## 🧪 測試指南

### 運行測試套件

```bash
# 完整測試
npm test

# 具體測試範例
npm test -- --testNamePattern="should join lottery"
```

### 測試涵蓋範圍

#### CatLottery 測試

- ✅ 合約部署
- ✅ 參與抽獎功能
- ✅ 抽獎機制
- ✅ NFT 發送集成
- ✅ 權限控制
- ✅ 錯誤處理

#### CatNFT 測試 (需要實現)

- ⚠️ NFT 鑄造功能
- ⚠️ 轉移機制
- ⚠️ 查詢功能
- ⚠️ 權限控制

### 手動測試

```bash
# 1. 部署合約
npm run build
npx ts-node scripts/deploy-nft.ts

# 2. 與合約互動
npx ts-node scripts/interact.ts

# 3. 驗證功能
npx tsx scripts/verify.ts
```

---

## 📚 API 參考

### CatLottery 合約 API

#### 接收消息

| 消息              | 參數                   | 描述          | 權限     |
| ----------------- | ---------------------- | ------------- | -------- |
| `"join"`          | -                      | 參與抽獎      | 任何人   |
| `"drawWinner"`    | -                      | 執行抽獎      | 僅擁有者 |
| `"startNewRound"` | -                      | 開始新輪次    | 僅擁有者 |
| `"withdraw"`      | -                      | 提取餘額      | 僅擁有者 |
| `SetNFTContract`  | `nftContract: Address` | 設定 NFT 合約 | 僅擁有者 |

#### 查詢方法

| 方法                    | 返回值           | 描述           |
| ----------------------- | ---------------- | -------------- |
| `getContractInfo()`     | `ContractInfo`   | 獲取合約狀態   |
| `getParticipant(index)` | `Participant?`   | 獲取參與者資訊 |
| `getWinner(round)`      | `LotteryResult?` | 獲取中獎記錄   |
| `getBalance()`          | `Int`            | 獲取合約餘額   |

### CatNFT 合約 API

#### 接收消息

| 消息          | 參數                            | 描述                | 權限          |
| ------------- | ------------------------------- | ------------------- | ------------- |
| `"mint"`      | -                               | 鑄造 NFT 給自己     | 僅擁有者      |
| `MintTo`      | `to: Address`                   | 鑄造 NFT 給指定地址 | 僅擁有者      |
| `TransferNFT` | `nftId: Int, newOwner: Address` | 轉移 NFT            | 僅 NFT 擁有者 |
| `"withdraw"`  | -                               | 提取餘額            | 僅擁有者      |

#### 查詢方法

| 方法                 | 返回值         | 描述              |
| -------------------- | -------------- | ----------------- |
| `getContractInfo()`  | `ContractInfo` | 獲取合約資訊      |
| `getNftOwner(nftId)` | `Address?`     | 獲取 NFT 擁有者   |
| `nftExists(nftId)`   | `Bool`         | 檢查 NFT 是否存在 |
| `getCatInfo(nftId)`  | `CatInfo`      | 獲取貓咪資訊      |

---

## 💡 使用範例

### 完整抽獎流程

```typescript
// 1. 部署並設定合約
const lottery = await CatLottery.fromInit(owner, entryFee, maxParticipants);
const nft = await CatNFT.fromInit(owner);

// 2. 設定 NFT 合約地址
await lottery.send(owner, value, {
  $$type: 'SetNFTContract',
  nftContract: nft.address,
});

// 3. 用戶參與抽獎
await lottery.send(user, { value: entryFee }, 'join');

// 4. 執行抽獎
await lottery.send(owner, value, 'drawWinner');

// 5. 查詢中獎結果
const winner = await lottery.getWinner(1);
console.log(`中獎者: ${winner.winner}`);
console.log(`NFT ID: ${winner.nftId}`);
```

### NFT 操作範例

```typescript
// 鑄造 NFT
await nftContract.send(owner, value, {
  $$type: 'MintTo',
  to: recipientAddress,
});

// 轉移 NFT
await nftContract.send(currentOwner, value, {
  $$type: 'TransferNFT',
  nftId: 1,
  newOwner: newOwnerAddress,
});

// 查詢貓咪資訊
const catInfo = await nftContract.getCatInfo(1);
console.log(`貓咪: ${catInfo.name} (${catInfo.rarity})`);
```

---

## 🛠️ 故障排除

### 常見問題

#### 1. 編譯錯誤

**問題：** `Cannot find module '@tact-lang/compiler'`

```bash
# 解決方案
npm install @tact-lang/compiler
```

#### 2. 部署失敗

**問題：** `Invalid address checksum`

```bash
# 檢查地址格式，確保使用正確的 TON 地址格式
# EQ... 或 UQ... 開頭
```

#### 3. 測試失敗

**問題：** 測試運行失敗

```bash
# 重新編譯並運行測試
npm run build
npm test
```

#### 4. NFT 鑄造失敗

**問題：** `Only owner can mint`

```bash
# 確保使用正確的擁有者地址發送交易
```

### 除錯技巧

1. **檢查編譯輸出**

```bash
npm run build 2>&1 | tee build.log
```

2. **使用詳細日誌**

```bash
npm test -- --verbose
```

3. **檢查合約狀態**

```bash
npx tsx scripts/verify.ts
```