package wallet

import (
	"crypto/ed25519"
	"strings"
	"testing"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/pkg/logger"
)

func TestNewManager(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	if manager == nil {
		t.Fatal("Expected manager to be created, got nil")
	}

	if manager.address == "" {
		t.Error("Expected address to be set")
	}

	if manager.privateKey == nil {
		t.Error("Expected private key to be set")
	}

	if manager.publicKey == nil {
		t.Error("Expected public key to be set")
	}
}

func TestLoadFromPrivateKey(t *testing.T) {
	log := logger.New("debug")

	t.Run("valid 32-byte seed", func(t *testing.T) {
		// 32字節的種子
		seed := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

		cfg := &config.Config{
			WalletPrivateKey: seed,
			LogLevel:         "debug",
		}

		manager, err := NewManager(cfg, log)
		if err != nil {
			t.Fatalf("NewManager() with 32-byte seed failed: %v", err)
		}

		if len(manager.privateKey) != ed25519.PrivateKeySize {
			t.Errorf("Expected private key size %d, got %d", ed25519.PrivateKeySize, len(manager.privateKey))
		}

		if len(manager.publicKey) != ed25519.PublicKeySize {
			t.Errorf("Expected public key size %d, got %d", ed25519.PublicKeySize, len(manager.publicKey))
		}
	})

	t.Run("valid 64-byte private key", func(t *testing.T) {
		// 64字節的完整私鑰（這裡用重複的32字節模擬）
		privateKey := strings.Repeat("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", 2)

		cfg := &config.Config{
			WalletPrivateKey: privateKey,
			LogLevel:         "debug",
		}

		manager, err := NewManager(cfg, log)
		if err != nil {
			t.Fatalf("NewManager() with 64-byte private key failed: %v", err)
		}

		if len(manager.privateKey) != ed25519.PrivateKeySize {
			t.Errorf("Expected private key size %d, got %d", ed25519.PrivateKeySize, len(manager.privateKey))
		}
	})

	t.Run("private key with 0x prefix", func(t *testing.T) {
		seed := "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

		cfg := &config.Config{
			WalletPrivateKey: seed,
			LogLevel:         "debug",
		}

		manager, err := NewManager(cfg, log)
		if err != nil {
			t.Fatalf("NewManager() with 0x prefix failed: %v", err)
		}

		if manager.privateKey == nil {
			t.Error("Expected private key to be loaded")
		}
	})

	t.Run("invalid hex format", func(t *testing.T) {
		cfg := &config.Config{
			WalletPrivateKey: "invalid_hex",
			LogLevel:         "debug",
		}

		_, err := NewManager(cfg, log)
		if err == nil {
			t.Fatal("Expected NewManager() to fail with invalid hex")
		}
	})

	t.Run("invalid key length", func(t *testing.T) {
		// 16字節的無效長度
		cfg := &config.Config{
			WalletPrivateKey: "0123456789abcdef0123456789abcdef",
			LogLevel:         "debug",
		}

		_, err := NewManager(cfg, log)
		if err == nil {
			t.Fatal("Expected NewManager() to fail with invalid key length")
		}
	})

	t.Run("no private key or mnemonic", func(t *testing.T) {
		cfg := &config.Config{
			LogLevel: "debug",
		}

		_, err := NewManager(cfg, log)
		if err == nil {
			t.Fatal("Expected NewManager() to fail with no credentials")
		}
	})
}

func TestGetAddress(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	address := manager.GetAddress()
	if address == "" {
		t.Error("Expected non-empty address")
	}

	if !strings.HasPrefix(address, "EQ") {
		t.Errorf("Expected address to start with 'EQ', got %s", address)
	}
}

func TestGetPublicKey(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	pubKey := manager.GetPublicKey()
	if len(pubKey) != ed25519.PublicKeySize {
		t.Errorf("Expected public key size %d, got %d", ed25519.PublicKeySize, len(pubKey))
	}
}

func TestSignMessage(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	message := []byte("test message")
	signature, err := manager.SignMessage(message)
	if err != nil {
		t.Fatalf("SignMessage() failed: %v", err)
	}

	if len(signature) != ed25519.SignatureSize {
		t.Errorf("Expected signature size %d, got %d", ed25519.SignatureSize, len(signature))
	}

	// 驗證簽名
	valid := ed25519.Verify(manager.publicKey, message, signature)
	if !valid {
		t.Error("Signature verification failed")
	}
}

func TestVerifySignature(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	message := []byte("test message")
	signature, err := manager.SignMessage(message)
	if err != nil {
		t.Fatalf("SignMessage() failed: %v", err)
	}

	// 測試有效簽名
	valid := manager.VerifySignature(message, signature, manager.publicKey)
	if !valid {
		t.Error("Valid signature should be verified as true")
	}

	// 測試無效簽名
	invalidSignature := make([]byte, ed25519.SignatureSize)
	valid = manager.VerifySignature(message, invalidSignature, manager.publicKey)
	if valid {
		t.Error("Invalid signature should be verified as false")
	}

	// 測試錯誤的消息
	wrongMessage := []byte("wrong message")
	valid = manager.VerifySignature(wrongMessage, signature, manager.publicKey)
	if valid {
		t.Error("Signature for wrong message should be verified as false")
	}
}

func TestCreateTransaction(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	to := "EQTestAddress123"
	amount := int64(1000000000) // 1 TON
	payload := []byte("test payload")

	transaction, err := manager.CreateTransaction(to, amount, payload)
	if err != nil {
		t.Fatalf("CreateTransaction() failed: %v", err)
	}

	if len(transaction) == 0 {
		t.Error("Expected non-empty transaction")
	}

	// 檢查序號是否增加
	initialSeqno := manager.seqno
	_, err = manager.CreateTransaction(to, amount, payload)
	if err != nil {
		t.Fatalf("Second CreateTransaction() failed: %v", err)
	}

	if manager.seqno != initialSeqno+1 {
		t.Errorf("Expected seqno to increment from %d to %d, got %d",
			initialSeqno, initialSeqno+1, manager.seqno)
	}
}

func TestCreateDrawWinnerTransaction(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	contractAddress := "EQLotteryContract123"
	transaction, err := manager.CreateDrawWinnerTransaction(contractAddress)
	if err != nil {
		t.Fatalf("CreateDrawWinnerTransaction() failed: %v", err)
	}

	if len(transaction) == 0 {
		t.Error("Expected non-empty transaction")
	}
}

func TestCreateStartNewRoundTransaction(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	contractAddress := "EQLotteryContract123"
	transaction, err := manager.CreateStartNewRoundTransaction(contractAddress)
	if err != nil {
		t.Fatalf("CreateStartNewRoundTransaction() failed: %v", err)
	}

	if len(transaction) == 0 {
		t.Error("Expected non-empty transaction")
	}
}

func TestCreateSetNFTContractTransaction(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	contractAddress := "EQLotteryContract123"
	nftAddress := "EQNFTContract456"

	transaction, err := manager.CreateSetNFTContractTransaction(contractAddress, nftAddress)
	if err != nil {
		t.Fatalf("CreateSetNFTContractTransaction() failed: %v", err)
	}

	if len(transaction) == 0 {
		t.Error("Expected non-empty transaction")
	}
}

func TestGenerateAddress(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	address1 := manager.generateAddress()

	// 使用不同的私鑰創建另一個管理器
	cfg2 := &config.Config{
		WalletPrivateKey: "1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}

	manager2, err := NewManager(cfg2, log)
	if err != nil {
		t.Fatalf("NewManager() for second key failed: %v", err)
	}

	address2 := manager2.generateAddress()

	// 不同的私鑰應該產生不同的地址
	if address1 == address2 {
		t.Error("Different private keys should generate different addresses")
	}

	// 地址應該以 EQ 開頭
	if !strings.HasPrefix(address1, "EQ") {
		t.Errorf("Expected address to start with 'EQ', got %s", address1)
	}

	if !strings.HasPrefix(address2, "EQ") {
		t.Errorf("Expected address to start with 'EQ', got %s", address2)
	}
}

func TestLoadFromMnemonic(t *testing.T) {
	cfg := &config.Config{
		WalletMnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	// 由於 loadFromMnemonic 尚未實作，應該返回錯誤
	_, err := NewManager(cfg, log)
	if err == nil {
		t.Fatal("Expected NewManager() to fail with unimplemented mnemonic loading")
	}

	if !strings.Contains(err.Error(), "助記詞載入功能尚未實作") {
		t.Errorf("Expected specific error message about unimplemented mnemonic, got: %v", err)
	}
}

func TestGetBalance(t *testing.T) {
	cfg := &config.Config{
		WalletPrivateKey: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		LogLevel:         "debug",
	}
	log := logger.New(cfg.LogLevel)

	manager, err := NewManager(cfg, log)
	if err != nil {
		t.Fatalf("NewManager() failed: %v", err)
	}

	// 由於 GetBalance 尚未實作，應該返回錯誤
	_, err = manager.GetBalance()
	if err == nil {
		t.Fatal("Expected GetBalance() to fail with unimplemented balance query")
	}

	if !strings.Contains(err.Error(), "餘額查詢功能尚未實作") {
		t.Errorf("Expected specific error message about unimplemented balance query, got: %v", err)
	}
}
