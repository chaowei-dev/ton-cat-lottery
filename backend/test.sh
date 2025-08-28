#!/bin/bash
# 🧪 TON Cat Lottery Backend Test Script
# 基礎測試腳本，用於DevOps流程

echo "🚀 Starting TON Cat Lottery Backend Tests..."

# 檢查Go環境
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed"
    exit 1
fi

# 進入backend目錄
cd "$(dirname "$0")"

echo "📦 Downloading dependencies..."
go mod tidy

echo "🔧 Running go vet..."
if ! go vet ./...; then
    echo "❌ go vet failed"
    exit 1
fi

echo "🏗️ Building application..."
if ! go build -o ton-cat-lottery-backend main.go; then
    echo "❌ Build failed"
    exit 1
fi

echo "🧹 Cleaning up build artifacts..."
rm -f ton-cat-lottery-backend

echo "✅ All tests passed! Backend is ready for DevOps deployment."
exit 0
