# 🐱 TON Cat Lottery - 智能合約文檔

> 基於 TON 區塊鏈的貓咪 NFT 抽獎系統

---

## 📋 目錄

- [項目概覽](#項目概覽)
- [合約架構](#合約架構)
- [快速開始](#快速開始)
- [部署到測試網](#部署到測試網)
- [API 參考](#api-參考)
- [故障排除](#故障排除)

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

### 🎨 NFT 稀有度系統

| 稀有度        | 名稱             | 描述                   |
| ------------- | ---------------- | ---------------------- |
| **Common**    | Orange Tabby     | 友善的橘色虎斑貓       |
| **Rare**      | Siamese Princess | 優雅的暹羅貓，藍色眼睛 |
| **Epic**      | Maine Coon King  | 威嚴的緬因貓，王者風範 |
| **Legendary** | Cosmic Cat       | 神秘的宇宙貓，來自星空 |

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

### 🎯 核心功能

#### CatLottery 功能

- **參與抽獎**: 支付 0.1 TON 參與當前輪次
- **執行抽獎**: 隨機選出中獎者並自動發送 NFT
- **參與者管理**: 防止重複參與，達到上限自動關閉

#### CatNFT 功能

- **NFT 鑄造**: 鑄造貓咪 NFT 給指定地址
- **所有權轉移**: 安全的 NFT 轉移機制
- **查詢功能**: 查詢 NFT 擁有者和貓咪資訊

---

## 🚀 快速開始

### 環境要求

```bash
Node.js >= 22.0.0
npm >= 8.0.0
```

### 安裝與編譯

```bash
# 進入合約目錄
cd contracts

# 安裝依賴
npm install

# 編譯合約
npm run build
```

### 運行測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- tests/CatLottery.test.ts
```

---

## 🌐 部署到測試網

### 前置準備

1. **確認 Node.js 版本**

   版本需要 >= 22.18.0

2. **更新依賴版本**
   確保 `package.json` 包含正確版本：

```json
{
  "dependencies": {
    "@tact-lang/compiler": "^1.6.5",
    "@ton/blueprint": "^0.38.0",
    "@ton/core": "^0.61.0",
    "@ton/ton": "^15.0.0"
  },
  "devDependencies": {
    "@ton/sandbox": "^0.35.0",
    "@ton/test-utils": "^0.9.0",
    "tsx": "latest",
    "typescript": "^5.6.0"
  }
}
```

3. **獲取測試網 TON**
   - 安裝 Tonkeeper 錢包並切換到測試網
   - 使用 Telegram Bot `@testgiver_ton_bot` 獲取免費測試 TON
   - 確保錢包有至少 1 TON 用於部署

### 部署步驟

1. **編譯合約**

```bash
npm run build
```

2. **創建部署腳本** `scripts/deployCatLottery.ts`

```typescript
import { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';
import { CatLottery } from '../build/CatLottery_CatLottery';

export async function run(provider: NetworkProvider) {
  const owner = provider.sender().address!;
  const entryFee = toNano('0.1'); // 0.1 TON 參與費
  const maxParticipants = 10;

  const catLottery = provider.open(
    CatLottery.fromInit(owner, entryFee, maxParticipants)
  );

  await catLottery.send(
    provider.sender(),
    {
      value: toNano('0.2'), // 部署費用
    },
    {
      $$type: 'Deploy',
      queryId: 0n,
    }
  );

  await provider.waitForDeploy(catLottery.address);
  console.log('✅ 合約部署成功!');
  console.log('📍 合約地址:', catLottery.address.toString());

  return catLottery.address;
}
```

3. **執行部署**

```bash
# 使用 Blueprint 部署
npx blueprint run deployCatLottery --testnet --tonconnect
```

4. **驗證部署**

```bash
# 檢查合約狀態
npx tsx scripts/interact.ts
```

### 成功部署示例

```
✅ 合約部署成功!
📍 合約地址: EQCTPU-Wo7_2TDoi6Os3fy53iwIEG-3ZsNXYcAr0F_qWSoQY
🔗 TON Testnet Explorer: https://testnet.tonviewer.com/EQCTPU-Wo7_2TDoi6Os3fy53iwIEG-3ZsNXYcAr0F_qWSoQY
```

---

## 📚 API 參考

### CatLottery 合約

#### 接收消息

| 消息              | 參數      | 描述          | 權限     |
| ----------------- | --------- | ------------- | -------- |
| `"join"`          | -         | 參與抽獎      | 任何人   |
| `"drawWinner"`    | -         | 執行抽獎      | 僅擁有者 |
| `"startNewRound"` | -         | 開始新輪次    | 僅擁有者 |
| `SetNFTContract`  | `Address` | 設定 NFT 合約 | 僅擁有者 |

#### 查詢方法

| 方法                   | 返回值           | 描述           |
| ---------------------- | ---------------- | -------------- |
| `getGetContractInfo()` | `ContractInfo`   | 獲取合約狀態   |
| `getGetParticipant(i)` | `Participant?`   | 獲取參與者資訊 |
| `getGetWinner(round)`  | `LotteryResult?` | 獲取中獎記錄   |

### CatNFT 合約

#### 接收消息

| 消息          | 參數                            | 描述                | 權限          |
| ------------- | ------------------------------- | ------------------- | ------------- |
| `"mint"`      | -                               | 鑄造 NFT 給自己     | 僅擁有者      |
| `MintTo`      | `to: Address`                   | 鑄造 NFT 給指定地址 | 僅擁有者      |
| `TransferNFT` | `nftId: Int, newOwner: Address` | 轉移 NFT            | 僅 NFT 擁有者 |

#### 查詢方法

| 方法                 | 返回值         | 描述            |
| -------------------- | -------------- | --------------- |
| `getContractInfo()`  | `ContractInfo` | 獲取合約資訊    |
| `getNftOwner(nftId)` | `Address?`     | 獲取 NFT 擁有者 |
| `getCatInfo(nftId)`  | `CatInfo`      | 獲取貓咪資訊    |

---

## 💡 使用範例

### 完整抽獎流程

```typescript
// 1. 部署合約
const lottery = await CatLottery.fromInit(owner, entryFee, maxParticipants);
const nft = await CatNFT.fromInit(owner);

// 2. 設定 NFT 合約
await lottery.send(owner, value, {
  $$type: 'SetNFTContract',
  nftContract: nft.address,
});

// 3. 用戶參與抽獎
await lottery.send(user, { value: entryFee }, 'join');

// 4. 執行抽獎
await lottery.send(owner, value, 'drawWinner');

// 5. 查詢結果
const winner = await lottery.getGetWinner(1);
```

---

## 🛠️ 故障排除

### 常見部署問題

#### 1. 依賴版本衝突

```bash
# 解決方案
npm install --legacy-peer-deps
# 或重新安裝
rm -rf node_modules package-lock.json && npm install
```

#### 2. Node.js 版本過低

```bash
# 解決方案
nvm install 22.18 && nvm use 22.18
```

#### 3. 錢包餘額不足

```bash
# 解決方案
# 1. 從 @testgiver_ton_bot 獲取更多測試 TON
# 2. 降低部署費用 (0.5 → 0.2 TON)
```

#### 4. 合約方法錯誤

```bash
# 問題: getContractInfo 不存在
# 解決: 使用 getGetContractInfo
```

#### 5. 導入路徑錯誤

```typescript
// 正確的導入路徑
import { CatLottery } from '../build/CatLottery_CatLottery';
```

### 除錯技巧

```bash
# 檢查編譯輸出
npm run build 2>&1 | tee build.log

# 詳細測試日誌
npm test -- --verbose

# 檢查合約狀態
npx tsx scripts/verify.ts
```

---

## 📋 命令參考

### 常用命令

```bash
# 編譯
npm run build

# 測試
npm test

# 部署到測試網
npx blueprint run deployCatLottery --testnet --tonconnect

# 與合約互動
npx tsx scripts/interact.ts

# 清理編譯產物
rm -rf build/* && npm run build
```

---

## 📚 參考資源

- [TON Blueprint](https://github.com/ton-org/blueprint)
- [TON Testnet Explorer](https://testnet.tonviewer.com/)
- [Tact 語言文檔](https://docs.tact-lang.org/)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/)

---

> 🎉 **已成功部署的合約地址**
>
> **CatLottery**: `EQCTPU-Wo7_2TDoi6Os3fy53iwIEG-3ZsNXYcAr0F_qWSoQY`
>
> 🔗 [在 TON Explorer 中查看](https://testnet.tonviewer.com/EQCTPU-Wo7_2TDoi6Os3fy53iwIEG-3ZsNXYcAr0F_qWSoQY)
