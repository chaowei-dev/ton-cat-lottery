#!/bin/bash

# =============================================================================
# TON Cat Lottery - GCP OIDC 設定腳本
# =============================================================================
# 功能：為 GitHub Actions 建立 Workload Identity Federation (OIDC)
# 技術：GCP Workload Identity + Service Account + IAM 權限配置
# 安全：無需儲存 Service Account 金鑰，使用 OIDC 短期 token
# =============================================================================

set -e  # 遇到錯誤立即退出

# 配置變數
PROJECT_ID="ton-cat-lottery-dev-3"
GITHUB_REPO="chaowei-dev/ton-cat-lottery"
SERVICE_ACCOUNT_NAME="gha-deploy"
WORKLOAD_IDENTITY_POOL_NAME="github-pool" 
WORKLOAD_IDENTITY_PROVIDER_NAME="github-provider"

# 顏色輸出函數
print_step() {
    echo "🔧 $1"
}

print_success() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️ $1"
}

print_error() {
    echo "❌ $1"
}

# =============================================================================
# 步驟 1：前置檢查
# =============================================================================
print_step "檢查 GCP 認證和專案設定..."

# 檢查是否已登入 GCP
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
    print_error "請先執行 gcloud auth login"
    exit 1
fi

# 設定當前專案
gcloud config set project $PROJECT_ID
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    print_error "專案設定失敗，當前: $CURRENT_PROJECT，期望: $PROJECT_ID"
    exit 1
fi

print_success "GCP 專案設定完成：$PROJECT_ID"

# =============================================================================
# 步驟 2：啟用必要的 API 服務
# =============================================================================
print_step "啟用必要的 GCP API 服務..."

REQUIRED_APIS=(
    "cloudresourcemanager.googleapis.com"
    "iam.googleapis.com"
    "iamcredentials.googleapis.com"
    "sts.googleapis.com"
    "container.googleapis.com"
    "artifactregistry.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        print_step "啟用 API: $api"
        gcloud services enable "$api"
    else
        print_success "API 已啟用: $api"
    fi
done

# =============================================================================
# 步驟 3：建立部署用 Service Account
# =============================================================================
print_step "建立 GitHub Actions 部署 Service Account..."

# 檢查 Service Account 是否存在
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &>/dev/null; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="GitHub Actions Deploy Service Account" \
        --description="用於 GitHub Actions CI/CD 流程的部署帳戶"
    print_success "Service Account 已建立: $SERVICE_ACCOUNT_EMAIL"
else
    print_success "Service Account 已存在: $SERVICE_ACCOUNT_EMAIL"
fi

# =============================================================================
# 步驟 4：分配 Service Account 權限
# =============================================================================
print_step "配置 Service Account 權限..."

# 必要權限列表
REQUIRED_ROLES=(
    "roles/container.developer"          # GKE 集群和應用管理
    "roles/artifactregistry.writer"      # Artifact Registry 推送
    "roles/storage.admin"                # GCS bucket 管理 (Terraform state)
    "roles/serviceusage.serviceUsageConsumer"  # 服務使用權限
    "roles/iam.serviceAccountTokenCreator"     # Service Account token 生成權限
)

for role in "${REQUIRED_ROLES[@]}"; do
    print_step "分配權限: $role"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
        --role="$role" \
        --quiet
done

print_success "Service Account 權限配置完成"

# =============================================================================
# 步驟 5：建立 Workload Identity Pool
# =============================================================================
print_step "建立 Workload Identity Pool..."

# 檢查 Pool 是否存在
if ! gcloud iam workload-identity-pools describe $WORKLOAD_IDENTITY_POOL_NAME \
    --location=global &>/dev/null; then
    
    gcloud iam workload-identity-pools create $WORKLOAD_IDENTITY_POOL_NAME \
        --location=global \
        --display-name="GitHub Actions Pool" \
        --description="Workload Identity Pool for GitHub Actions"
    
    print_success "Workload Identity Pool 已建立: $WORKLOAD_IDENTITY_POOL_NAME"
else
    print_success "Workload Identity Pool 已存在: $WORKLOAD_IDENTITY_POOL_NAME"
fi

# =============================================================================
# 步驟 6：建立 OIDC Provider
# =============================================================================
print_step "建立 GitHub OIDC Provider..."

# 檢查 Provider 是否存在
if ! gcloud iam workload-identity-pools providers describe $WORKLOAD_IDENTITY_PROVIDER_NAME \
    --workload-identity-pool=$WORKLOAD_IDENTITY_POOL_NAME \
    --location=global &>/dev/null; then
    
    gcloud iam workload-identity-pools providers create-oidc $WORKLOAD_IDENTITY_PROVIDER_NAME \
        --workload-identity-pool=$WORKLOAD_IDENTITY_POOL_NAME \
        --location=global \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
        --attribute-condition="assertion.repository=='$GITHUB_REPO'"
    
    print_success "OIDC Provider 已建立: $WORKLOAD_IDENTITY_PROVIDER_NAME"
else
    print_success "OIDC Provider 已存在: $WORKLOAD_IDENTITY_PROVIDER_NAME"
fi

# =============================================================================
# 步驟 7：設定 Service Account Impersonation
# =============================================================================
print_step "設定 Service Account 模擬權限..."

PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
WIF_PROVIDER_NAME="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$WORKLOAD_IDENTITY_POOL_NAME/providers/$WORKLOAD_IDENTITY_PROVIDER_NAME"

# 授權 GitHub repo 模擬 Service Account
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/$WIF_PROVIDER_NAME/attribute.repository/$GITHUB_REPO" \
    --quiet

print_success "Service Account 模擬權限設定完成"

# =============================================================================
# 步驟 8：輸出 GitHub Secrets 配置資訊
# =============================================================================
print_success "🎉 GCP OIDC 設定完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 GitHub Secrets 設定資訊"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "請在 GitHub Repository Settings → Secrets and variables → Actions 中設定："
echo ""
echo "🔐 GCP_WIF_PROVIDER:"
echo "    $WIF_PROVIDER_NAME"
echo ""
echo "🔐 GCP_SERVICE_ACCOUNT:"
echo "    $SERVICE_ACCOUNT_EMAIL"
echo ""
echo "🔐 PROJECT_ID:"
echo "    $PROJECT_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 驗證命令"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "# 檢查 Workload Identity Pool"
echo "gcloud iam workload-identity-pools list --location=global"
echo ""
echo "# 檢查 Service Account 權限"
echo "gcloud projects get-iam-policy $PROJECT_ID --flatten=\"bindings[].members\" --filter=\"bindings.members:serviceAccount:$SERVICE_ACCOUNT_EMAIL\""
echo ""
echo "# 檢查 OIDC Provider"
echo "gcloud iam workload-identity-pools providers describe $WORKLOAD_IDENTITY_PROVIDER_NAME --workload-identity-pool=$WORKLOAD_IDENTITY_POOL_NAME --location=global"
echo ""
echo "✅ 設定完成！現在可以在 GitHub Actions 中使用 OIDC 認證部署到 GCP"