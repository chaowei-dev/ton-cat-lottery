#!/bin/bash

# =============================================================================
# TON Cat Lottery - CI/CD 配置驗證腳本
# =============================================================================
# 功能：驗證 CI/CD 基礎設施配置的完整性和正確性
# 使用：./scripts/verify-cicd.sh
# =============================================================================

set -e

# 顏色輸出函數
print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

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

# 檢查依賴工具
check_dependencies() {
    print_header "檢查依賴工具"
    
    local tools=("gcloud" "kubectl" "docker" "git")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            print_success "$tool 已安裝"
        else
            print_error "$tool 未找到"
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "缺少必要工具: ${missing_tools[*]}"
        echo "請先安裝缺少的工具後再運行此腳本"
        exit 1
    fi
    
    print_success "所有依賴工具檢查通過"
}

# 檢查 GitHub Actions 工作流程檔案
check_github_workflows() {
    print_header "檢查 GitHub Actions 工作流程"
    
    # 檢查 .github/workflows 目錄
    if [ ! -d ".github/workflows" ]; then
        print_error ".github/workflows 目錄不存在"
        return 1
    fi
    print_success ".github/workflows 目錄存在"
    
    # 檢查 CI 工作流程
    if [ -f ".github/workflows/ci.yml" ]; then
        print_success "CI 工作流程檔案存在"
        
        # 驗證 CI 工作流程基本結構
        local required_jobs=("code-quality" "test-suite" "security-scan" "docker-build")
        for job in "${required_jobs[@]}"; do
            if grep -q "$job:" ".github/workflows/ci.yml"; then
                print_success "CI job '$job' 已定義"
            else
                print_warning "CI job '$job' 未找到"
            fi
        done
    else
        print_error "CI 工作流程檔案 (.github/workflows/ci.yml) 不存在"
    fi
    
    # 檢查 CD 工作流程
    if [ -f ".github/workflows/cd.yml" ]; then
        print_success "CD 工作流程檔案存在"
        
        # 驗證 CD 工作流程基本結構
        local required_jobs=("pre-deployment" "build-and-push" "deploy-to-gke")
        for job in "${required_jobs[@]}"; do
            if grep -q "$job:" ".github/workflows/cd.yml"; then
                print_success "CD job '$job' 已定義"
            else
                print_warning "CD job '$job' 未找到"
            fi
        done
    else
        print_error "CD 工作流程檔案 (.github/workflows/cd.yml) 不存在"
    fi
}

# 檢查 GCP 設定
check_gcp_setup() {
    print_header "檢查 GCP 設定"
    
    # 檢查 gcloud 認證
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null; then
        local active_account=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
        print_success "已登入 GCP 帳戶: $active_account"
    else
        print_error "未登入 GCP，請執行: gcloud auth login"
        return 1
    fi
    
    # 檢查專案設定
    local current_project=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$current_project" ]; then
        print_success "當前 GCP 專案: $current_project"
    else
        print_error "未設定 GCP 專案，請執行: gcloud config set project PROJECT_ID"
        return 1
    fi
    
    # 檢查必要的 API 服務
    print_step "檢查必要的 API 服務..."
    local required_apis=(
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com" 
        "iamcredentials.googleapis.com"
        "container.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${required_apis[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            print_success "API 已啟用: $api"
        else
            print_warning "API 未啟用: $api"
        fi
    done
    
    # 檢查 Artifact Registry
    print_step "檢查 Artifact Registry..."
    if gcloud artifacts repositories list --location=asia-east1 --format="value(name)" | grep -q "tcl-repo"; then
        print_success "Artifact Registry 存在: tcl-repo"
    else
        print_error "Artifact Registry 不存在: tcl-repo"
        echo "請建立 Artifact Registry: gcloud artifacts repositories create tcl-repo --repository-format=docker --location=asia-east1"
    fi
}

# 檢查 Workload Identity 設定
check_workload_identity() {
    print_header "檢查 Workload Identity 設定"
    
    # 檢查 OIDC 設定腳本
    if [ -f "setup-gcp-oidc.sh" ]; then
        print_success "OIDC 設定腳本存在: setup-gcp-oidc.sh"
        
        if [ -x "setup-gcp-oidc.sh" ]; then
            print_success "OIDC 腳本可執行"
        else
            print_warning "OIDC 腳本不可執行，請執行: chmod +x setup-gcp-oidc.sh"
        fi
    else
        print_error "OIDC 設定腳本不存在: setup-gcp-oidc.sh"
        return 1
    fi
    
    # 檢查 Workload Identity Pool
    print_step "檢查 Workload Identity Pool..."
    if gcloud iam workload-identity-pools list --location=global --format="value(name)" | grep -q "github-pool"; then
        print_success "Workload Identity Pool 存在: github-pool"
        
        # 檢查 Provider
        if gcloud iam workload-identity-pools providers list \
            --workload-identity-pool=github-pool \
            --location=global \
            --format="value(name)" | grep -q "github-provider"; then
            print_success "OIDC Provider 存在: github-provider"
        else
            print_warning "OIDC Provider 不存在: github-provider"
        fi
    else
        print_warning "Workload Identity Pool 不存在: github-pool"
        echo "請執行 OIDC 設定腳本: ./setup-gcp-oidc.sh"
    fi
    
    # 檢查服務帳戶
    print_step "檢查服務帳戶..."
    local current_project=$(gcloud config get-value project 2>/dev/null)
    local service_account="gha-deploy@${current_project}.iam.gserviceaccount.com"
    
    if gcloud iam service-accounts describe "$service_account" &>/dev/null; then
        print_success "服務帳戶存在: $service_account"
    else
        print_warning "服務帳戶不存在: $service_account"
        echo "請執行 OIDC 設定腳本: ./setup-gcp-oidc.sh"
    fi
}

# 檢查 Kubernetes 設定
check_kubernetes_setup() {
    print_header "檢查 Kubernetes 設定"
    
    # 檢查 kubectl 配置
    if kubectl cluster-info &>/dev/null; then
        print_success "kubectl 已配置並可連接集群"
        
        local cluster_info=$(kubectl config current-context 2>/dev/null)
        print_success "當前集群: $cluster_info"
    else
        print_warning "kubectl 無法連接集群"
        echo "請執行: gcloud container clusters get-credentials CLUSTER_NAME --region REGION"
    fi
    
    # 檢查命名空間
    print_step "檢查命名空間..."
    local namespaces=("tcl-production" "tcl-staging" "monitoring")
    
    for ns in "${namespaces[@]}"; do
        if kubectl get namespace "$ns" &>/dev/null; then
            print_success "命名空間存在: $ns"
        else
            print_warning "命名空間不存在: $ns"
        fi
    done
    
    # 檢查 Kustomize 配置
    print_step "檢查 Kustomize 配置..."
    local overlays=("production" "staging")
    
    for overlay in "${overlays[@]}"; do
        local kustomize_path="k8s/overlays/$overlay/kustomization.yaml"
        if [ -f "$kustomize_path" ]; then
            print_success "Kustomize 配置存在: $overlay"
        else
            print_warning "Kustomize 配置不存在: $kustomize_path"
        fi
    done
}

# 檢查 Docker 配置
check_docker_setup() {
    print_header "檢查 Docker 配置"
    
    # 檢查 Docker 運行狀態
    if docker info &>/dev/null; then
        print_success "Docker daemon 運行中"
    else
        print_error "Docker daemon 未運行"
        echo "請啟動 Docker Desktop 或 Docker 服務"
        return 1
    fi
    
    # 檢查 Dockerfile
    local dockerfiles=("docker/Dockerfile.frontend" "docker/Dockerfile.backend")
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$dockerfile" ]; then
            print_success "Dockerfile 存在: $dockerfile"
        else
            print_error "Dockerfile 不存在: $dockerfile"
        fi
    done
    
    # 檢查 Docker Compose 配置
    if [ -f "docker-compose.yml" ]; then
        print_success "Docker Compose 配置存在"
        
        # 驗證 Docker Compose 語法
        if docker-compose config &>/dev/null; then
            print_success "Docker Compose 配置語法正確"
        else
            print_warning "Docker Compose 配置有語法錯誤"
        fi
    else
        print_warning "Docker Compose 配置不存在"
    fi
}

# 檢查專案結構
check_project_structure() {
    print_header "檢查專案結構"
    
    # 檢查主要目錄
    local directories=("contracts" "frontend" "backend" "terraform" "k8s" "docs" "scripts")
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            print_success "目錄存在: $dir"
        else
            print_warning "目錄不存在: $dir"
        fi
    done
    
    # 檢查重要檔案
    local files=("README.md" "CLAUDE.md" ".gitignore" "setup-gcp-oidc.sh")
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            print_success "檔案存在: $file"
        else
            print_warning "檔案不存在: $file"
        fi
    done
}

# 生成驗證報告
generate_report() {
    print_header "驗證報告"
    
    echo "📊 CI/CD 配置驗證完成"
    echo ""
    echo "🔍 已檢查項目："
    echo "  ✓ 依賴工具安裝"
    echo "  ✓ GitHub Actions 工作流程"  
    echo "  ✓ GCP 設定和服務"
    echo "  ✓ Workload Identity 配置"
    echo "  ✓ Kubernetes 集群設定"
    echo "  ✓ Docker 配置"
    echo "  ✓ 專案結構"
    echo ""
    echo "📝 下一步建議："
    echo "  1. 如果有 ⚠️ 警告，請根據提示進行修正"
    echo "  2. 執行 OIDC 設定: ./setup-gcp-oidc.sh"
    echo "  3. 設定 GitHub Secrets (參見 OIDC 腳本輸出)"
    echo "  4. 推送代碼觸發 CI/CD 流程"
    echo ""
    echo "🔗 相關連結："
    echo "  📚 文檔: docs/DevOpsREADME.md"
    echo "  🎯 GitHub Actions: https://github.com/你的用戶名/ton-cat-lottery/actions"
    echo "  ☁️ GCP Console: https://console.cloud.google.com/"
}

# 主函數
main() {
    print_header "TON Cat Lottery CI/CD 配置驗證"
    
    echo "🎯 開始驗證 CI/CD 基礎設施配置..."
    echo ""
    
    # 執行各項檢查
    check_dependencies
    check_project_structure
    check_github_workflows
    check_docker_setup
    check_gcp_setup
    check_workload_identity
    check_kubernetes_setup
    
    # 生成報告
    generate_report
    
    print_success "驗證完成！ 🎉"
}

# 執行主函數
main