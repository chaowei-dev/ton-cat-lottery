package transaction

import (
	"context"
	"fmt"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/internal/ton"
	"ton-cat-lottery-backend/pkg/logger"
)

// Monitor 交易監控器
type Monitor struct {
	config    *config.Config
	logger    *logger.Logger
	tonClient *ton.Client
}

// Result 交易監控結果
type Result struct {
	Hash   string
	Status string
	Error  error
}

// NewMonitor 創建新的交易監控器
func NewMonitor(cfg *config.Config, log *logger.Logger, tonClient *ton.Client) *Monitor {
	return &Monitor{
		config:    cfg,
		logger:    log.WithGroup("tx_monitor"),
		tonClient: tonClient,
	}
}

// WaitForConfirmation 等待交易確認
func (m *Monitor) WaitForConfirmation(ctx context.Context, txHash string) (*Result, error) {
	m.logger.Info("開始監控交易", "hash", txHash)

	result := &Result{
		Hash:   txHash,
		Status: "pending",
	}

	// 設定超時時間
	timeout := time.NewTimer(5 * time.Minute)
	defer timeout.Stop()

	// 設定檢查間隔
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			result.Error = ctx.Err()
			return result, fmt.Errorf("交易監控被取消: %w", ctx.Err())

		case <-timeout.C:
			result.Error = fmt.Errorf("交易確認超時")
			return result, result.Error

		case <-ticker.C:
			status, err := m.tonClient.GetTransactionStatus(ctx, txHash)
			if err != nil {
				m.logger.Warn("查詢交易狀態失敗", "hash", txHash, "error", err)
				// 繼續嘗試，不立即返回錯誤
				continue
			}

			result.Status = status
			m.logger.Debug("交易狀態更新", "hash", txHash, "status", status)

			switch status {
			case "success":
				m.logger.Info("交易執行成功", "hash", txHash)
				return result, nil

			case "failed":
				result.Error = fmt.Errorf("交易執行失敗")
				m.logger.Error("交易執行失敗", "hash", txHash)
				return result, result.Error

			case "pending":
				// 繼續等待
				continue

			default:
				m.logger.Warn("未知的交易狀態", "hash", txHash, "status", status)
				continue
			}
		}
	}
}

// WaitForConfirmationWithRetry 帶重試機制的交易確認
func (m *Monitor) WaitForConfirmationWithRetry(ctx context.Context, txHash string, maxRetries int) (*Result, error) {
	for attempt := 1; attempt <= maxRetries; attempt++ {
		m.logger.Info("交易確認嘗試", "hash", txHash, "attempt", attempt, "max", maxRetries)

		result, err := m.WaitForConfirmation(ctx, txHash)
		if err == nil {
			return result, nil
		}

		// 如果是最後一次嘗試，返回錯誤
		if attempt == maxRetries {
			m.logger.Error("交易確認最終失敗", "hash", txHash, "attempts", maxRetries, "error", err)
			return result, err
		}

		// 等待一段時間後重試
		retryDelay := time.Duration(attempt) * m.config.RetryDelay
		m.logger.Info("等待重試", "delay", retryDelay)

		select {
		case <-ctx.Done():
			return result, ctx.Err()
		case <-time.After(retryDelay):
			continue
		}
	}

	return nil, fmt.Errorf("達到最大重試次數")
}
