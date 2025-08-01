package lottery

import (
	"context"
	"fmt"
	"sync"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/pkg/logger"
)

// Service 抽獎服務
type Service struct {
	config  *config.Config
	logger  *logger.Logger
	ctx     context.Context
	cancel  context.CancelFunc
	wg      sync.WaitGroup
	running bool
	mu      sync.RWMutex
}

// NewService 創建新的抽獎服務
func NewService(cfg *config.Config, log *logger.Logger) *Service {
	ctx, cancel := context.WithCancel(context.Background())

	return &Service{
		config: cfg,
		logger: log.WithGroup("lottery"),
		ctx:    ctx,
		cancel: cancel,
	}
}

// Start 啟動抽獎服務
func (s *Service) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return fmt.Errorf("抽獎服務已在運行中")
	}

	s.logger.Info("🎯 抽獎服務啟動中...",
		"auto_draw", s.config.AutoDraw,
		"draw_interval", s.config.DrawInterval,
		"max_participants", s.config.MaxParticipants,
	)

	// 如果啟用自動抽獎，啟動定時器
	if s.config.AutoDraw {
		s.wg.Add(1)
		go s.autoDrawLoop()
	}

	s.running = true
	s.logger.Info("✅ 抽獎服務啟動成功")

	return nil
}

// Stop 停止抽獎服務
func (s *Service) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return
	}

	s.logger.Info("🛑 正在停止抽獎服務...")

	// 取消所有運行中的 goroutine
	s.cancel()

	// 等待所有 goroutine 結束
	s.wg.Wait()

	s.running = false
	s.logger.Info("✅ 抽獎服務已停止")
}

// autoDrawLoop 自動抽獎迴圈
func (s *Service) autoDrawLoop() {
	defer s.wg.Done()

	ticker := time.NewTicker(s.config.DrawInterval)
	defer ticker.Stop()

	s.logger.Info("⏰ 自動抽獎計時器啟動", "interval", s.config.DrawInterval)

	for {
		select {
		case <-s.ctx.Done():
			s.logger.Info("📝 自動抽獎迴圈已停止")
			return
		case <-ticker.C:
			s.logger.Debug("⚡ 觸發自動抽獎檢查")
			if err := s.checkAndDraw(); err != nil {
				s.logger.Error("自動抽獎失敗", "error", err)
			}
		}
	}
}

// checkAndDraw 檢查抽獎條件並執行抽獎
func (s *Service) checkAndDraw() error {
	s.logger.Debug("🔍 檢查抽獎條件...")

	// TODO: 實作檢查邏輯
	// 1. 查詢合約狀態
	// 2. 檢查參與人數是否達到條件
	// 3. 執行抽獎

	s.logger.Info("ℹ️ 抽獎條件檢查完成 (尚未實作)")
	return nil
}

// DrawWinner 手動執行抽獎
func (s *Service) DrawWinner() error {
	s.logger.Info("🎲 手動執行抽獎...")

	// TODO: 實作抽獎邏輯
	// 1. 檢查合約狀態
	// 2. 發送 drawWinner 交易
	// 3. 監控交易結果
	// 4. 記錄中獎結果

	s.logger.Info("ℹ️ 手動抽獎執行完成 (尚未實作)")
	return nil
}

// GetStatus 獲取服務狀態
func (s *Service) GetStatus() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"running":          s.running,
		"auto_draw":        s.config.AutoDraw,
		"draw_interval":    s.config.DrawInterval.String(),
		"max_participants": s.config.MaxParticipants,
		"min_participants": s.config.MinParticipants,
		"entry_fee_ton":    s.config.EntryFeeTON,
	}
}
