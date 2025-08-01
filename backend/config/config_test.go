package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	// 清除環境變數
	envVars := []string{
		"ENVIRONMENT", "LOG_LEVEL", "PORT", "TON_API_ENDPOINT", "TON_NETWORK",
		"LOTTERY_CONTRACT_ADDRESS", "NFT_CONTRACT_ADDRESS",
		"WALLET_PRIVATE_KEY", "WALLET_MNEMONIC",
		"DRAW_INTERVAL", "MAX_PARTICIPANTS", "MIN_PARTICIPANTS",
		"ENTRY_FEE_TON", "AUTO_DRAW", "RETRY_COUNT", "RETRY_DELAY",
	}

	// 保存原始環境變數
	originalValues := make(map[string]string)
	for _, key := range envVars {
		originalValues[key] = os.Getenv(key)
		os.Unsetenv(key)
	}

	// 測試完成後恢復環境變數
	defer func() {
		for key, value := range originalValues {
			if value != "" {
				os.Setenv(key, value)
			} else {
				os.Unsetenv(key)
			}
		}
	}()

	t.Run("should load with default values", func(t *testing.T) {
		// 設定必要的環境變數
		os.Setenv("LOTTERY_CONTRACT_ADDRESS", "test_lottery_address")
		os.Setenv("NFT_CONTRACT_ADDRESS", "test_nft_address")
		os.Setenv("WALLET_PRIVATE_KEY", "test_private_key")

		cfg, err := Load()
		if err != nil {
			t.Fatalf("Load() failed: %v", err)
		}

		// 驗證默認值
		if cfg.Environment != "development" {
			t.Errorf("Expected Environment='development', got %s", cfg.Environment)
		}
		if cfg.LogLevel != "info" {
			t.Errorf("Expected LogLevel='info', got %s", cfg.LogLevel)
		}
		if cfg.Port != "8080" {
			t.Errorf("Expected Port='8080', got %s", cfg.Port)
		}
		if cfg.MaxParticipants != 10 {
			t.Errorf("Expected MaxParticipants=10, got %d", cfg.MaxParticipants)
		}
		if cfg.MinParticipants != 2 {
			t.Errorf("Expected MinParticipants=2, got %d", cfg.MinParticipants)
		}
		if cfg.DrawInterval != 30*time.Minute {
			t.Errorf("Expected DrawInterval=30m, got %v", cfg.DrawInterval)
		}
	})

	t.Run("should load from environment variables", func(t *testing.T) {
		// 設定環境變數
		os.Setenv("ENVIRONMENT", "production")
		os.Setenv("LOG_LEVEL", "debug")
		os.Setenv("PORT", "9000")
		os.Setenv("TON_NETWORK", "mainnet")
		os.Setenv("LOTTERY_CONTRACT_ADDRESS", "EQTest123")
		os.Setenv("NFT_CONTRACT_ADDRESS", "EQTestNFT456")
		os.Setenv("WALLET_PRIVATE_KEY", "abcd1234")
		os.Setenv("MAX_PARTICIPANTS", "20")
		os.Setenv("MIN_PARTICIPANTS", "5")
		os.Setenv("DRAW_INTERVAL", "1h")
		os.Setenv("AUTO_DRAW", "false")
		os.Setenv("RETRY_COUNT", "5")

		cfg, err := Load()
		if err != nil {
			t.Fatalf("Load() failed: %v", err)
		}

		// 驗證環境變數值
		if cfg.Environment != "production" {
			t.Errorf("Expected Environment='production', got %s", cfg.Environment)
		}
		if cfg.LogLevel != "debug" {
			t.Errorf("Expected LogLevel='debug', got %s", cfg.LogLevel)
		}
		if cfg.Port != "9000" {
			t.Errorf("Expected Port='9000', got %s", cfg.Port)
		}
		if cfg.TONNetwork != "mainnet" {
			t.Errorf("Expected TONNetwork='mainnet', got %s", cfg.TONNetwork)
		}
		if cfg.MaxParticipants != 20 {
			t.Errorf("Expected MaxParticipants=20, got %d", cfg.MaxParticipants)
		}
		if cfg.MinParticipants != 5 {
			t.Errorf("Expected MinParticipants=5, got %d", cfg.MinParticipants)
		}
		if cfg.DrawInterval != time.Hour {
			t.Errorf("Expected DrawInterval=1h, got %v", cfg.DrawInterval)
		}
		if cfg.AutoDraw != false {
			t.Errorf("Expected AutoDraw=false, got %v", cfg.AutoDraw)
		}
		if cfg.RetryCount != 5 {
			t.Errorf("Expected RetryCount=5, got %d", cfg.RetryCount)
		}
	})

	t.Run("should fail with missing required config", func(t *testing.T) {
		// 清除所有環境變數
		for _, key := range envVars {
			os.Unsetenv(key)
		}

		// 只設定部分必要配置
		os.Setenv("LOTTERY_CONTRACT_ADDRESS", "test_address")
		// 缺少 NFT_CONTRACT_ADDRESS 和 WALLET_PRIVATE_KEY

		_, err := Load()
		if err == nil {
			t.Fatal("Expected Load() to fail with missing config")
		}
	})
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name      string
		config    *Config
		wantError bool
	}{
		{
			name: "valid config",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				NFTContractAddress:     "EQTestNFT456",
				WalletPrivateKey:       "test_key",
				TONNetwork:             "testnet",
				MinParticipants:        2,
				MaxParticipants:        10,
			},
			wantError: false,
		},
		{
			name: "missing lottery contract address",
			config: &Config{
				NFTContractAddress: "EQTestNFT456",
				WalletPrivateKey:   "test_key",
				TONNetwork:         "testnet",
				MinParticipants:    2,
				MaxParticipants:    10,
			},
			wantError: true,
		},
		{
			name: "missing NFT contract address",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				WalletPrivateKey:       "test_key",
				TONNetwork:             "testnet",
				MinParticipants:        2,
				MaxParticipants:        10,
			},
			wantError: true,
		},
		{
			name: "missing wallet credentials",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				NFTContractAddress:     "EQTestNFT456",
				TONNetwork:             "testnet",
				MinParticipants:        2,
				MaxParticipants:        10,
			},
			wantError: true,
		},
		{
			name: "invalid TON network",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				NFTContractAddress:     "EQTestNFT456",
				WalletPrivateKey:       "test_key",
				TONNetwork:             "invalid",
				MinParticipants:        2,
				MaxParticipants:        10,
			},
			wantError: true,
		},
		{
			name: "invalid min participants",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				NFTContractAddress:     "EQTestNFT456",
				WalletPrivateKey:       "test_key",
				TONNetwork:             "testnet",
				MinParticipants:        0,
				MaxParticipants:        10,
			},
			wantError: true,
		},
		{
			name: "max participants less than min",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				NFTContractAddress:     "EQTestNFT456",
				WalletPrivateKey:       "test_key",
				TONNetwork:             "testnet",
				MinParticipants:        10,
				MaxParticipants:        5,
			},
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.validate()
			if (err != nil) != tt.wantError {
				t.Errorf("validate() error = %v, wantError %v", err, tt.wantError)
			}
		})
	}
}

func TestGetEnvHelpers(t *testing.T) {
	t.Run("getEnvString", func(t *testing.T) {
		// 測試默認值
		result := getEnvString("NON_EXISTENT_KEY", "default")
		if result != "default" {
			t.Errorf("Expected 'default', got %s", result)
		}

		// 測試環境變數值
		os.Setenv("TEST_STRING", "test_value")
		defer os.Unsetenv("TEST_STRING")

		result = getEnvString("TEST_STRING", "default")
		if result != "test_value" {
			t.Errorf("Expected 'test_value', got %s", result)
		}
	})

	t.Run("getEnvInt", func(t *testing.T) {
		// 測試默認值
		result := getEnvInt("NON_EXISTENT_KEY", 42)
		if result != 42 {
			t.Errorf("Expected 42, got %d", result)
		}

		// 測試有效整數
		os.Setenv("TEST_INT", "123")
		defer os.Unsetenv("TEST_INT")

		result = getEnvInt("TEST_INT", 42)
		if result != 123 {
			t.Errorf("Expected 123, got %d", result)
		}

		// 測試無效整數（應該返回默認值）
		os.Setenv("TEST_INVALID_INT", "not_a_number")
		defer os.Unsetenv("TEST_INVALID_INT")

		result = getEnvInt("TEST_INVALID_INT", 42)
		if result != 42 {
			t.Errorf("Expected 42 (default), got %d", result)
		}
	})

	t.Run("getEnvBool", func(t *testing.T) {
		// 測試默認值
		result := getEnvBool("NON_EXISTENT_KEY", true)
		if result != true {
			t.Errorf("Expected true, got %v", result)
		}

		// 測試有效布林值
		os.Setenv("TEST_BOOL", "false")
		defer os.Unsetenv("TEST_BOOL")

		result = getEnvBool("TEST_BOOL", true)
		if result != false {
			t.Errorf("Expected false, got %v", result)
		}
	})

	t.Run("getEnvDuration", func(t *testing.T) {
		// 測試默認值
		result := getEnvDuration("NON_EXISTENT_KEY", time.Minute)
		if result != time.Minute {
			t.Errorf("Expected 1m, got %v", result)
		}

		// 測試有效時間間隔
		os.Setenv("TEST_DURATION", "30s")
		defer os.Unsetenv("TEST_DURATION")

		result = getEnvDuration("TEST_DURATION", time.Minute)
		if result != 30*time.Second {
			t.Errorf("Expected 30s, got %v", result)
		}
	})
}
