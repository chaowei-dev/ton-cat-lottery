package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config 包含所有應用程式配置
type Config struct {
	// 服務配置
	Environment string `json:"environment"`
	LogLevel    string `json:"log_level"`
	Port        string `json:"port"`

	// TON 網路配置
	TONAPIEndpoint string `json:"ton_api_endpoint"`
	TONNetwork     string `json:"ton_network"` // testnet, mainnet

	// 合約地址
	LotteryContractAddress string `json:"lottery_contract_address"`
	NFTContractAddress     string `json:"nft_contract_address"`

	// 錢包配置
	WalletPrivateKey string `json:"wallet_private_key"`
	WalletMnemonic   string `json:"wallet_mnemonic"`

	// 抽獎配置
	DrawInterval    time.Duration `json:"draw_interval"`    // 抽獎間隔
	MaxParticipants int           `json:"max_participants"` // 最大參與人數
	MinParticipants int           `json:"min_participants"` // 最小參與人數
	EntryFeeTON     float64       `json:"entry_fee_ton"`    // 參與費用 (TON)
	AutoDraw        bool          `json:"auto_draw"`        // 是否自動抽獎
	RetryCount      int           `json:"retry_count"`      // 重試次數
	RetryDelay      time.Duration `json:"retry_delay"`      // 重試延遲
}

// Load 從環境變數載入配置
func Load() (*Config, error) {
	cfg := &Config{
		Environment:            getEnvString("ENVIRONMENT", "development"),
		LogLevel:               getEnvString("LOG_LEVEL", "info"),
		Port:                   getEnvString("PORT", "8080"),
		TONAPIEndpoint:         getEnvString("TON_API_ENDPOINT", "https://testnet.toncenter.com/api/v2/"),
		TONNetwork:             getEnvString("TON_NETWORK", "testnet"),
		LotteryContractAddress: getEnvString("LOTTERY_CONTRACT_ADDRESS", ""),
		NFTContractAddress:     getEnvString("NFT_CONTRACT_ADDRESS", ""),
		WalletPrivateKey:       getEnvString("WALLET_PRIVATE_KEY", ""),
		WalletMnemonic:         getEnvString("WALLET_MNEMONIC", ""),
		DrawInterval:           getEnvDuration("DRAW_INTERVAL", 30*time.Minute),
		MaxParticipants:        getEnvInt("MAX_PARTICIPANTS", 10),
		MinParticipants:        getEnvInt("MIN_PARTICIPANTS", 2),
		EntryFeeTON:            getEnvFloat64("ENTRY_FEE_TON", 0.1),
		AutoDraw:               getEnvBool("AUTO_DRAW", true),
		RetryCount:             getEnvInt("RETRY_COUNT", 3),
		RetryDelay:             getEnvDuration("RETRY_DELAY", 5*time.Second),
	}

	// 驗證必要配置
	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("配置驗證失敗: %w", err)
	}

	return cfg, nil
}

// validate 驗證配置是否完整
func (c *Config) validate() error {
	if c.LotteryContractAddress == "" {
		return fmt.Errorf("LOTTERY_CONTRACT_ADDRESS 不能為空")
	}

	if c.NFTContractAddress == "" {
		return fmt.Errorf("NFT_CONTRACT_ADDRESS 不能為空")
	}

	if c.WalletPrivateKey == "" && c.WalletMnemonic == "" {
		return fmt.Errorf("WALLET_PRIVATE_KEY 或 WALLET_MNEMONIC 必須設定其中一個")
	}

	if c.TONNetwork != "testnet" && c.TONNetwork != "mainnet" {
		return fmt.Errorf("TON_NETWORK 必須是 testnet 或 mainnet")
	}

	if c.MinParticipants < 1 {
		return fmt.Errorf("MIN_PARTICIPANTS 必須大於 0")
	}

	if c.MaxParticipants < c.MinParticipants {
		return fmt.Errorf("MAX_PARTICIPANTS 必須大於或等於 MIN_PARTICIPANTS")
	}

	return nil
}

// 輔助函數：取得環境變數 (字串)
func getEnvString(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// 輔助函數：取得環境變數 (整數)
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// 輔助函數：取得環境變數 (浮點數)
func getEnvFloat64(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return defaultValue
}

// 輔助函數：取得環境變數 (布林值)
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

// 輔助函數：取得環境變數 (時間間隔)
func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}
