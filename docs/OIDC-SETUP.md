# GitHub Actions OIDC 設定指南

## 📋 總覽

將 GitHub Actions 從 Service Account Key (`GCP_SA_KEY`) 遷移到 OIDC (Workload Identity Federation)，提升安全性。

## 🔧 步驟 1: 執行 GCP OIDC 設定

### 在 GCP Cloud Shell 或本地執行：

```bash
# 1. 確保你已登入 GCP
gcloud auth login

# 2. 設定預設專案
gcloud config set project ton-cat-lottery-dev-2

# 3. 執行 OIDC 設定腳本
chmod +x setup-gcp-oidc.sh
./setup-gcp-oidc.sh
```

### 腳本將建立：
- ✅ Workload Identity Pool: `github-pool`
- ✅ Workload Identity Provider: `github-provider`
- ✅ Service Account: `gha-deploy@ton-cat-lottery-dev-2.iam.gserviceaccount.com`
- ✅ IAM 角色綁定：
  - `roles/container.developer` (GKE 部署)
  - `roles/artifactregistry.writer` (推送 Docker 映像)
  - `roles/compute.viewer` (查看計算資源)
  - `roles/iam.serviceAccountUser` (使用 Service Account)

## 🔑 步驟 2: 設定 GitHub Secrets

進入你的 GitHub repository：
**Settings → Secrets and variables → Actions → New repository secret**

### 必要的 GCP OIDC Secrets：
```
GCP_PROJECT_ID
ton-cat-lottery-dev-2

GCP_WIF_PROVIDER  
projects/你的專案編號/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

### Cloudflare & Domain Secrets (選用)：
```
CLOUDFLARE_EMAIL
gba115566@gmail.com

CLOUDFLARE_API_TOKEN
zOyGAVz_GbK0e8EE0rP8Z2C_S6ePIefN2C_Xjycm

CLOUDFLARE_ZONE_ID
c90d2fca6fa4b3cea3d8360f0649294a

LETSENCRYPT_EMAIL
gba115566@gmail.com

APP_DOMAIN
cat-lottery.chaowei-liu.com
```

## 🚀 步驟 3: 測試部署

### 觸發 CI/CD：
```bash
# 推送到 main 分支觸發自動部署
git push origin main

# 或手動觸發 CD workflow
# 在 GitHub Actions 頁面點擊 "Run workflow"
```

### 驗證成功：
- ✅ CI workflow 通過所有測試
- ✅ Docker 映像成功推送到 Artifact Registry  
- ✅ GKE 部署成功更新
- ✅ 應用程式正常運行

## 🔒 安全性優勢

### OIDC vs Service Account Key：

| 特性 | Service Account Key | OIDC |
|------|-------------------|------|
| **安全性** | ❌ 長期憑證，容易洩漏 | ✅ 短期 token，自動輪替 |
| **管理** | ❌ 需手動輪替 key | ✅ 完全自動化 |
| **權限** | ❌ 難以追蹤使用情況 | ✅ 細粒度控制 |
| **稽核** | ❌ 有限的記錄 | ✅ 詳細的稽核日誌 |

## 🛠 故障排除

### 常見問題：

1. **Permission denied 錯誤**
   ```bash
   # 檢查 Service Account 權限
   gcloud projects get-iam-policy ton-cat-lottery-dev-2 \
     --flatten="bindings[].members" \
     --filter="bindings.members:gha-deploy@ton-cat-lottery-dev-2.iam.gserviceaccount.com"
   ```

2. **Workload Identity 綁定問題**
   ```bash
   # 檢查綁定狀態
   gcloud iam service-accounts get-iam-policy \
     gha-deploy@ton-cat-lottery-dev-2.iam.gserviceaccount.com
   ```

3. **GitHub Actions 認證失敗**
   - 確認 GitHub Secrets 正確設定
   - 檢查 repository 路徑是否匹配 `chaowei-dev/ton-cat-lottery`

## 📞 支援

如果遇到問題，請檢查：
- GCP IAM 權限設定
- GitHub Secrets 配置
- GitHub Actions workflow logs