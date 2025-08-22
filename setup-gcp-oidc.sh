#!/bin/bash

# TON Cat Lottery - GCP OIDC Setup for GitHub Actions
# 設定 Workload Identity Federation 讓 GitHub Actions 可以部署到 GCP

PROJECT_ID="ton-cat-lottery-dev-3"
SERVICE_ACCOUNT_NAME="gha-deploy"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

# GitHub repository 路徑
GITHUB_REPO="chaowei-dev/ton-cat-lottery"

echo "Setting up OIDC for GitHub Actions deployment..."
echo "Project: $PROJECT_ID"
echo "GitHub Repo: $GITHUB_REPO"
echo ""

# 1. 取得專案編號
echo "1. Getting project number..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# 2. 建立 Workload Identity Pool
echo "2. Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create $POOL_NAME \
    --project=$PROJECT_ID \
    --location=global \
    --display-name="GitHub Actions Pool"

# 3. 建立 Workload Identity Provider
echo "3. Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_NAME \
    --project=$PROJECT_ID \
    --location=global \
    --workload-identity-pool=$POOL_NAME \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# 4. 建立 Service Account
echo "4. Creating Service Account..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --project=$PROJECT_ID \
    --display-name="GitHub Actions Deploy" \
    --description="Service account for GitHub Actions CI/CD"

# 5. 授權 Service Account 所需角色
echo "5. Adding IAM roles to Service Account..."
ROLES=(
    "roles/container.developer"
    "roles/artifactregistry.writer" 
    "roles/compute.viewer"
    "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
    echo "Adding role: $role"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="$role"
done

# 6. 綁定 GitHub repository 與 Service Account
echo "6. Binding GitHub repository to Service Account..."
gcloud iam service-accounts add-iam-policy-binding \
    --project=$PROJECT_ID \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$GITHUB_REPO" \
    $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com

echo ""
echo "✅ OIDC Setup Complete!"
echo ""
echo "📋 Add these secrets to your GitHub repository:"
echo "Repository Settings → Secrets and variables → Actions"
echo ""
echo "GCP_PROJECT_ID:"
echo "$PROJECT_ID"
echo ""
echo "GCP_WIF_PROVIDER:"
echo "projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_NAME/providers/$PROVIDER_NAME"
echo ""
echo "🚀 Ready to use! Your GitHub Actions can now deploy to GCP using OIDC."
echo "Repository: $GITHUB_REPO"