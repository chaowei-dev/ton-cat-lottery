package wallet

import (
	"crypto/ed25519"
	"encoding/binary"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

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
	seqno      uint32 // 序號用於交易防重放
}

// MessageType 消息類型
type MessageType int

const (
	MessageTypeText MessageType = iota
	MessageTypeDrawWinner
	MessageTypeStartNewRound
	MessageTypeSetNFTContract
	MessageTypeWithdraw
)

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

	// 驗證私鑰長度：可以是32字節的種子或64字節的完整私鑰
	if len(privateKeyBytes) == ed25519.SeedSize {
		// 32字節的種子，需要生成完整的私鑰
		m.privateKey = ed25519.NewKeyFromSeed(privateKeyBytes)
		m.publicKey = m.privateKey.Public().(ed25519.PublicKey)
	} else if len(privateKeyBytes) == ed25519.PrivateKeySize {
		// 64字節的完整私鑰
		m.privateKey = ed25519.PrivateKey(privateKeyBytes)
		m.publicKey = m.privateKey.Public().(ed25519.PublicKey)
	} else {
		return fmt.Errorf("私鑰長度無效，預期 %d bytes（種子）或 %d bytes（完整私鑰），實際 %d bytes",
			ed25519.SeedSize, ed25519.PrivateKeySize, len(privateKeyBytes))
	}

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

	// 增加序號（防重放攻擊）
	m.seqno++

	// 創建交易消息結構（簡化版本）
	// 注意：這是一個簡化實現，實際TON交易需要更複雜的編碼
	transaction, err := m.buildTransaction(to, amount, payload, m.seqno)
	if err != nil {
		return nil, fmt.Errorf("構建交易失敗: %w", err)
	}

	// 簽名交易
	signedTransaction, err := m.signTransaction(transaction)
	if err != nil {
		return nil, fmt.Errorf("簽名交易失敗: %w", err)
	}

	m.logger.Info("交易創建成功", "transaction_length", len(signedTransaction))
	return signedTransaction, nil
}

// buildTransaction 構建交易（簡化版本）
func (m *Manager) buildTransaction(to string, amount int64, payload []byte, seqno uint32) ([]byte, error) {
	// TODO: 實現正確的TON交易格式
	// 這是一個簡化版本，實際需要使用TL-B編碼和Cell結構

	// 構建基本交易結構
	var txData []byte

	// 添加發送方地址
	txData = append(txData, []byte(m.address)...)

	// 添加接收方地址
	txData = append(txData, []byte(to)...)

	// 添加金額（8字節）
	amountBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(amountBytes, uint64(amount))
	txData = append(txData, amountBytes...)

	// 添加序號（4字節）
	seqnoBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(seqnoBytes, seqno)
	txData = append(txData, seqnoBytes...)

	// 添加時間戳（8字節）
	timestamp := time.Now().Unix()
	timestampBytes := make([]byte, 8)
	binary.BigEndian.PutUint64(timestampBytes, uint64(timestamp))
	txData = append(txData, timestampBytes...)

	// 添加載荷
	if len(payload) > 0 {
		txData = append(txData, payload...)
	}

	return txData, nil
}

// signTransaction 簽名交易
func (m *Manager) signTransaction(transaction []byte) ([]byte, error) {
	// 使用私鑰簽名交易
	signature := ed25519.Sign(m.privateKey, transaction)

	// 組合簽名和交易（簡化版本）
	signedTx := make([]byte, 0, len(signature)+len(transaction))
	signedTx = append(signedTx, signature...)
	signedTx = append(signedTx, transaction...)

	return signedTx, nil
}

// CreateDrawWinnerTransaction 創建抽獎交易
func (m *Manager) CreateDrawWinnerTransaction(contractAddress string) ([]byte, error) {
	m.logger.Debug("創建抽獎交易", "contract", contractAddress)

	// 創建 "drawWinner" 消息載荷
	payload := []byte("drawWinner")

	// 創建交易（需要支付少量gas費用）
	return m.CreateTransaction(contractAddress, 50000000, payload) // 0.05 TON gas費
}

// CreateStartNewRoundTransaction 創建開始新輪次交易
func (m *Manager) CreateStartNewRoundTransaction(contractAddress string) ([]byte, error) {
	m.logger.Debug("創建開始新輪次交易", "contract", contractAddress)

	// 創建 "startNewRound" 消息載荷
	payload := []byte("startNewRound")

	// 創建交易
	return m.CreateTransaction(contractAddress, 50000000, payload) // 0.05 TON gas費
}

// CreateSetNFTContractTransaction 創建設定NFT合約交易
func (m *Manager) CreateSetNFTContractTransaction(contractAddress, nftAddress string) ([]byte, error) {
	m.logger.Debug("創建設定NFT合約交易", "contract", contractAddress, "nft", nftAddress)

	// 創建 SetNFTContract 消息載荷（簡化版本）
	// 實際需要根據TL-B格式編碼
	payload := []byte(fmt.Sprintf("setNFTContract:%s", nftAddress))

	return m.CreateTransaction(contractAddress, 50000000, payload) // 0.05 TON gas費
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
