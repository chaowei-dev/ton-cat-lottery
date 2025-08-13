package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	// Contract Configuration
	LotteryContractAddress string
	
	// Wallet Configuration
	WalletPrivateKey string
	
	// API Configuration
	TONAPIBaseURL     string
	APITimeout        time.Duration
	APIRateLimit      int
	APIMinInterval    time.Duration
	
	// Monitoring Configuration
	PollingInterval   time.Duration
	RetryAttempts     int
	RetryBaseDelay    time.Duration
	MinBalanceAlert   float64
	DrawTimeoutDuration time.Duration
	
	// Network Configuration
	IsTestnet bool
}

func Load() *Config {
	cfg := &Config{
		// Default values
		TONAPIBaseURL:       getEnv("TON_API_BASE_URL", "https://testnet.toncenter.com/api/v2"),
		APITimeout:          getEnvDuration("API_TIMEOUT", 10*time.Second),
		APIRateLimit:        getEnvInt("API_RATE_LIMIT", 20),
		APIMinInterval:      getEnvDuration("API_MIN_INTERVAL", 3*time.Second),
		PollingInterval:     getEnvDuration("POLLING_INTERVAL", 30*time.Second),
		RetryAttempts:       getEnvInt("RETRY_ATTEMPTS", 3),
		RetryBaseDelay:      getEnvDuration("RETRY_BASE_DELAY", 30*time.Second),
		MinBalanceAlert:     getEnvFloat("MIN_BALANCE_ALERT", 1.0),
		DrawTimeoutDuration: getEnvDuration("DRAW_TIMEOUT_DURATION", 5*time.Minute),
		IsTestnet:           getEnvBool("IS_TESTNET", true),
	}
	
	// Required environment variables
	cfg.LotteryContractAddress = os.Getenv("LOTTERY_CONTRACT_ADDRESS")
	cfg.WalletPrivateKey = os.Getenv("WALLET_PRIVATE_KEY")
	
	return cfg
}

func (c *Config) Validate() error {
	if c.LotteryContractAddress == "" {
		return &ConfigError{Field: "LOTTERY_CONTRACT_ADDRESS", Message: "is required"}
	}
	// WALLET_PRIVATE_KEY will be required when we implement transaction sending
	// For now, it's optional since we only do read operations
	// if c.WalletPrivateKey == "" {
	//     return &ConfigError{Field: "WALLET_PRIVATE_KEY", Message: "is required"}
	// }
	return nil
}

type ConfigError struct {
	Field   string
	Message string
}

func (e *ConfigError) Error() string {
	return "config error: " + e.Field + " " + e.Message
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatValue, err := strconv.ParseFloat(value, 64); err == nil {
			return floatValue
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}