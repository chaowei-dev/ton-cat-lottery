package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/internal/lottery"
	"ton-cat-lottery-backend/pkg/logger"
)

func main() {
	// 載入配置
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("載入配置失敗: %v", err)
	}

	// 初始化日誌系統
	appLogger := logger.New(cfg.LogLevel)

	appLogger.Info("🚀 TON Cat Lottery Backend 啟動中...")
	appLogger.Info("📋 配置載入完成")

	// 初始化抽獎服務
	lotteryService := lottery.NewService(cfg, appLogger)

	// 啟動服務
	if err := lotteryService.Start(); err != nil {
		appLogger.Fatal("啟動抽獎服務失敗", "error", err)
	}

	// 等待信號以優雅關閉
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	appLogger.Info("🛑 正在關閉服務...")
	lotteryService.Stop()
	appLogger.Info("✅ 服務已安全關閉")
}
