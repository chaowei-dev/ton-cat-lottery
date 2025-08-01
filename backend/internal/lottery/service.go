package lottery

import (
	"context"
	"fmt"
	"sync"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/internal/ton"
	"ton-cat-lottery-backend/internal/transaction"
	"ton-cat-lottery-backend/internal/wallet"
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

	// 依賴項
	tonClient *ton.Client
	wallet    *wallet.Manager
	txMonitor *transaction.Monitor
}

// NewService 創建新的抽獎服務
func NewService(cfg *config.Config, log *logger.Logger) (*Service, error) {
	ctx, cancel := context.WithCancel(context.Background())

	// 初始化TON客戶端
	tonClient := ton.NewClient(cfg, log)

	// 初始化錢包管理器
	walletManager, err := wallet.NewManager(cfg, log)
	if err != nil {
		cancel()
		return nil, fmt.Errorf("初始化錢包管理器失敗: %w", err)
	}

	// 初始化交易監控器
	txMonitor := transaction.NewMonitor(cfg, log, tonClient)

	service := &Service{
		config:    cfg,
		logger:    log.WithGroup("lottery"),
		ctx:       ctx,
		cancel:    cancel,
		tonClient: tonClient,
		wallet:    walletManager,
		txMonitor: txMonitor,
	}

	return service, nil
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

	// 1. 查詢合約狀態
	contractInfo, err := s.GetContractInfo()
	if err != nil {
		return fmt.Errorf("查詢合約狀態失敗: %w", err)
	}

	// 2. 檢查抽獎是否活躍
	if !contractInfo.LotteryActive {
		s.logger.Debug("抽獎未活躍，跳過檢查")
		return nil
	}

	// 3. 檢查參與人數是否達到條件
	if contractInfo.ParticipantCount < s.config.MinParticipants {
		s.logger.Debug("參與人數不足，跳過抽獎",
			"current", contractInfo.ParticipantCount,
			"required", s.config.MinParticipants)
		return nil
	}

	// 4. 檢查是否達到最大參與人數或需要強制抽獎
	shouldDraw := contractInfo.ParticipantCount >= s.config.MaxParticipants

	if shouldDraw {
		s.logger.Info("🎲 觸發自動抽獎",
			"participants", contractInfo.ParticipantCount,
			"round", contractInfo.CurrentRound)

		return s.SendDrawWinner()
	}

	s.logger.Debug("抽獎條件檢查完成，暫不抽獎")
	return nil
}

// DrawWinner 手動執行抽獎（已棄用，使用 SendDrawWinner）
func (s *Service) DrawWinner() error {
	return s.SendDrawWinner()
}

// SendDrawWinner 發送抽獎交易
func (s *Service) SendDrawWinner() error {
	s.logger.Info("🎲 發送抽獎交易...")

	// 1. 檢查合約狀態
	contractInfo, err := s.GetContractInfo()
	if err != nil {
		return fmt.Errorf("查詢合約狀態失敗: %w", err)
	}

	if !contractInfo.LotteryActive {
		return fmt.Errorf("抽獎未活躍")
	}

	if contractInfo.ParticipantCount < s.config.MinParticipants {
		return fmt.Errorf("參與人數不足: %d < %d",
			contractInfo.ParticipantCount, s.config.MinParticipants)
	}

	// 2. 創建抽獎交易
	transaction, err := s.wallet.CreateDrawWinnerTransaction(s.config.LotteryContractAddress)
	if err != nil {
		return fmt.Errorf("創建抽獎交易失敗: %w", err)
	}

	// 3. 發送交易
	txHash, err := s.tonClient.SendTransaction(s.ctx, transaction)
	if err != nil {
		return fmt.Errorf("發送抽獎交易失敗: %w", err)
	}

	s.logger.Info("抽獎交易已發送", "hash", txHash)

	// 4. 監控交易結果
	result, err := s.txMonitor.WaitForConfirmationWithRetry(s.ctx, txHash, s.config.RetryCount)
	if err != nil {
		return fmt.Errorf("抽獎交易監控失敗: %w", err)
	}

	if result.Status == "success" {
		s.logger.Info("🎉 抽獎執行成功", "hash", txHash, "round", contractInfo.CurrentRound)

		// 查詢中獎結果
		if winner, err := s.GetWinner(contractInfo.CurrentRound); err == nil {
			s.logger.Info("🏆 中獎者",
				"winner", winner.Winner,
				"nft_id", winner.NFTId,
				"round", contractInfo.CurrentRound)
		}

		return nil
	}

	return fmt.Errorf("抽獎交易失敗: %s", result.Status)
}

// SendStartNewRound 開始新輪次
func (s *Service) SendStartNewRound() error {
	s.logger.Info("🔄 開始新輪次...")

	// 1. 檢查合約狀態
	contractInfo, err := s.GetContractInfo()
	if err != nil {
		return fmt.Errorf("查詢合約狀態失敗: %w", err)
	}

	if contractInfo.LotteryActive {
		return fmt.Errorf("當前抽獎仍在進行中，不能開始新輪次")
	}

	// 2. 創建開始新輪次交易
	transaction, err := s.wallet.CreateStartNewRoundTransaction(s.config.LotteryContractAddress)
	if err != nil {
		return fmt.Errorf("創建新輪次交易失敗: %w", err)
	}

	// 3. 發送交易
	txHash, err := s.tonClient.SendTransaction(s.ctx, transaction)
	if err != nil {
		return fmt.Errorf("發送新輪次交易失敗: %w", err)
	}

	s.logger.Info("新輪次交易已發送", "hash", txHash)

	// 4. 監控交易結果
	result, err := s.txMonitor.WaitForConfirmationWithRetry(s.ctx, txHash, s.config.RetryCount)
	if err != nil {
		return fmt.Errorf("新輪次交易監控失敗: %w", err)
	}

	if result.Status == "success" {
		s.logger.Info("✅ 新輪次開始成功", "hash", txHash, "new_round", contractInfo.CurrentRound+1)
		return nil
	}

	return fmt.Errorf("新輪次交易失敗: %s", result.Status)
}

// === 查詢方法 ===

// GetContractInfo 獲取合約狀態
func (s *Service) GetContractInfo() (*ton.LotteryContractInfo, error) {
	return s.tonClient.GetLotteryContractInfo(s.ctx, s.config.LotteryContractAddress)
}

// GetParticipant 獲取參與者資訊
func (s *Service) GetParticipant(index int) (*ton.Participant, error) {
	return s.tonClient.GetParticipant(s.ctx, s.config.LotteryContractAddress, index)
}

// GetWinner 獲取中獎記錄
func (s *Service) GetWinner(round int) (*ton.LotteryResult, error) {
	return s.tonClient.GetWinner(s.ctx, s.config.LotteryContractAddress, round)
}

// GetContractBalance 獲取合約餘額
func (s *Service) GetContractBalance() (int64, error) {
	return s.tonClient.GetContractBalance(s.ctx, s.config.LotteryContractAddress)
}

// GetWalletAddress 獲取錢包地址
func (s *Service) GetWalletAddress() string {
	return s.wallet.GetAddress()
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
