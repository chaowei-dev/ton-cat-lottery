package wallet

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"strings"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/pkg/logger"
)

// Manager 錢包管理器
type Manager struct {
	config     *config.Config
	logger     *logger.Logger
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
	address    string
}

// NewManager 創建新的錢包管理器
func NewManager(cfg *config.Config, log *logger.Logger) (*Manager, error) {
	manager := &Manager{
		config: cfg,
		logger: log.WithGroup("wallet"),
	}

	// 初始化錢包
	if err := manager.initWallet(); err != nil {
		return nil, fmt.Errorf("初始化錢包失敗: %w", err)
	}

	return manager, nil
}

// initWallet 初始化錢包
func (m *Manager) initWallet() error {
	// 優先使用私鑰
	if m.config.WalletPrivateKey != "" {
		return m.loadFromPrivateKey(m.config.WalletPrivateKey)
	}

	// 使用助記詞
	if m.config.WalletMnemonic != "" {
		return m.loadFromMnemonic(m.config.WalletMnemonic)
	}

	return fmt.Errorf("未提供錢包私鑰或助記詞")
}

// loadFromPrivateKey 從私鑰載入錢包
func (m *Manager) loadFromPrivateKey(privateKeyHex string) error {
	m.logger.Debug("從私鑰載入錢包")

	// 移除可能的前綴
	privateKeyHex = strings.TrimPrefix(privateKeyHex, "0x")
	
	// 解碼私鑰
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return fmt.Errorf("無效的私鑰格式: %w", err)
	}

	// 驗證私鑰長度
	if len(privateKeyBytes) != ed25519.PrivateKeySize {
		return fmt.Errorf("私鑰長度無效，預期 %d bytes，實際 %d bytes", 
			ed25519.PrivateKeySize, len(privateKeyBytes))
	}

	// 創建密鑰對
	m.privateKey = ed25519.PrivateKey(privateKeyBytes)
	m.publicKey = m.privateKey.Public().(ed25519.PublicKey)

	// 生成地址 (簡化版本，實際需要根據 TON 地址規範)
	m.address = m.generateAddress()

	m.logger.Info("錢包載入成功", "address", m.address)
	return nil
}

// loadFromMnemonic 從助記詞載入錢包
func (m *Manager) loadFromMnemonic(mnemonic string) error {
	m.logger.Debug("從助記詞載入錢包")

	// TODO: 實作從助記詞生成私鑰的邏輯
	// 這需要使用 TON 的助記詞到私鑰的轉換算法
	
	return fmt.Errorf("助記詞載入功能尚未實作")
}

// generateAddress 生成 TON 地址
func (m *Manager) generateAddress() string {
	// TODO: 實作正確的 TON 地址生成邏輯
	// 這是一個簡化版本，實際需要根據 TON 地址規範實作
	
	publicKeyHex := hex.EncodeToString(m.publicKey)
	return fmt.Sprintf("EQ%s", publicKeyHex[:40]) // 簡化版本
}

// GetAddress 獲取錢包地址
func (m *Manager) GetAddress() string {
	return m.address
}

// GetPublicKey 獲取公鑰
func (m *Manager) GetPublicKey() ed25519.PublicKey {
	return m.publicKey
}

// SignMessage 簽名訊息
func (m *Manager) SignMessage(message []byte) ([]byte, error) {
	m.logger.Debug("簽名訊息", "message_length", len(message))

	if m.privateKey == nil {
		return nil, fmt.Errorf("錢包未初始化")
	}

	signature := ed25519.Sign(m.privateKey, message)
	
	m.logger.Debug("訊息簽名成功", "signature_length", len(signature))
	return signature, nil
}

// CreateTransaction 創建交易
func (m *Manager) CreateTransaction(to string, amount int64, payload []byte) ([]byte, error) {
	m.logger.Debug("創建交易", 
		"to", to,
		"amount", amount,
		"payload_length", len(payload),
	)

	// TODO: 實作正確的 TON 交易創建邏輯
	// 這需要根據 TON 的交易格式來實作
	
	transaction := []byte("dummy_transaction") // 占位符
	
	m.logger.Info("交易創建成功", "transaction_length", len(transaction))
	return transaction, nil
}

// VerifySignature 驗證簽名
func (m *Manager) VerifySignature(message, signature []byte, publicKey ed25519.PublicKey) bool {
	return ed25519.Verify(publicKey, message, signature)
}

// GetBalance 獲取錢包餘額
func (m *Manager) GetBalance() (int64, error) {
	// TODO: 實作查詢錢包餘額的邏輯
	// 這需要調用 TON API 來查詢地址餘額
	
	m.logger.Debug("查詢錢包餘額", "address", m.address)
	return 0, fmt.Errorf("餘額查詢功能尚未實作")
}