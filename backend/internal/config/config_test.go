package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	// Save original env
	originalVars := map[string]string{
		"LOTTERY_CONTRACT_ADDRESS": os.Getenv("LOTTERY_CONTRACT_ADDRESS"),
		"NFT_CONTRACT_ADDRESS":     os.Getenv("NFT_CONTRACT_ADDRESS"),
		"WALLET_PRIVATE_KEY":       os.Getenv("WALLET_PRIVATE_KEY"),
		"API_TIMEOUT":             os.Getenv("API_TIMEOUT"),
		"API_RATE_LIMIT":          os.Getenv("API_RATE_LIMIT"),
		"IS_TESTNET":              os.Getenv("IS_TESTNET"),
	}
	
	defer func() {
		for k, v := range originalVars {
			if v == "" {
				os.Unsetenv(k)
			} else {
				os.Setenv(k, v)
			}
		}
	}()
	
	// Set test environment variables
	os.Setenv("LOTTERY_CONTRACT_ADDRESS", "EQTest123")
	os.Setenv("NFT_CONTRACT_ADDRESS", "EQTestNFT456")
	os.Setenv("WALLET_PRIVATE_KEY", "test-private-key")
	os.Setenv("API_TIMEOUT", "15s")
	os.Setenv("API_RATE_LIMIT", "30")
	os.Setenv("IS_TESTNET", "true")
	
	cfg := Load()
	
	// Test required fields
	if cfg.LotteryContractAddress != "EQTest123" {
		t.Errorf("Expected LotteryContractAddress 'EQTest123', got '%s'", cfg.LotteryContractAddress)
	}
	
	if cfg.WalletPrivateKey != "test-private-key" {
		t.Errorf("Expected WalletPrivateKey 'test-private-key', got '%s'", cfg.WalletPrivateKey)
	}
	
	// Test parsed values
	if cfg.APITimeout != 15*time.Second {
		t.Errorf("Expected APITimeout 15s, got %v", cfg.APITimeout)
	}
	
	if cfg.APIRateLimit != 30 {
		t.Errorf("Expected APIRateLimit 30, got %d", cfg.APIRateLimit)
	}
	
	if !cfg.IsTestnet {
		t.Errorf("Expected IsTestnet true, got %t", cfg.IsTestnet)
	}
	
	// Test default values
	if cfg.TONAPIBaseURL != "https://testnet.toncenter.com/api/v2" {
		t.Errorf("Expected default TONAPIBaseURL, got '%s'", cfg.TONAPIBaseURL)
	}
	
	if cfg.PollingInterval != 30*time.Second {
		t.Errorf("Expected default PollingInterval 30s, got %v", cfg.PollingInterval)
	}
}

func TestLoadDefaults(t *testing.T) {
	// Clear environment
	envVars := []string{
		"LOTTERY_CONTRACT_ADDRESS", "NFT_CONTRACT_ADDRESS", "WALLET_PRIVATE_KEY",
		"TON_API_BASE_URL", "API_TIMEOUT", "API_RATE_LIMIT", "API_MIN_INTERVAL",
		"POLLING_INTERVAL", "RETRY_ATTEMPTS", "RETRY_BASE_DELAY", 
		"MIN_BALANCE_ALERT", "DRAW_TIMEOUT_DURATION", "IS_TESTNET",
	}
	
	original := make(map[string]string)
	for _, v := range envVars {
		original[v] = os.Getenv(v)
		os.Unsetenv(v)
	}
	
	defer func() {
		for k, v := range original {
			if v == "" {
				os.Unsetenv(k)
			} else {
				os.Setenv(k, v)
			}
		}
	}()
	
	cfg := Load()
	
	// Test all defaults
	if cfg.TONAPIBaseURL != "https://testnet.toncenter.com/api/v2" {
		t.Errorf("Expected default TONAPIBaseURL, got '%s'", cfg.TONAPIBaseURL)
	}
	
	if cfg.APITimeout != 10*time.Second {
		t.Errorf("Expected default APITimeout 10s, got %v", cfg.APITimeout)
	}
	
	if cfg.APIRateLimit != 20 {
		t.Errorf("Expected default APIRateLimit 20, got %d", cfg.APIRateLimit)
	}
	
	if cfg.APIMinInterval != 3*time.Second {
		t.Errorf("Expected default APIMinInterval 3s, got %v", cfg.APIMinInterval)
	}
	
	if cfg.PollingInterval != 30*time.Second {
		t.Errorf("Expected default PollingInterval 30s, got %v", cfg.PollingInterval)
	}
	
	if cfg.RetryAttempts != 3 {
		t.Errorf("Expected default RetryAttempts 3, got %d", cfg.RetryAttempts)
	}
	
	if cfg.RetryBaseDelay != 30*time.Second {
		t.Errorf("Expected default RetryBaseDelay 30s, got %v", cfg.RetryBaseDelay)
	}
	
	if cfg.MinBalanceAlert != 1.0 {
		t.Errorf("Expected default MinBalanceAlert 1.0, got %f", cfg.MinBalanceAlert)
	}
	
	if cfg.DrawTimeoutDuration != 5*time.Minute {
		t.Errorf("Expected default DrawTimeoutDuration 5m, got %v", cfg.DrawTimeoutDuration)
	}
	
	if !cfg.IsTestnet {
		t.Errorf("Expected default IsTestnet true, got %t", cfg.IsTestnet)
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name        string
		config      *Config
		expectError bool
		errorField  string
	}{
		{
			name: "Valid config",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				WalletPrivateKey:       "test-key",
			},
			expectError: false,
		},
		{
			name: "Missing lottery contract address",
			config: &Config{
				WalletPrivateKey:   "test-key",
			},
			expectError: true,
			errorField:  "LOTTERY_CONTRACT_ADDRESS",
		},
		{
			name: "Missing NFT contract address",
			config: &Config{
				LotteryContractAddress: "EQTest123",
				WalletPrivateKey:       "test-key",
			},
			expectError: true,
			errorField:  "NFT_CONTRACT_ADDRESS",
		},
		{
			name: "Missing wallet private key",
			config: &Config{
				LotteryContractAddress: "EQTest123",
			},
			expectError: true,
			errorField:  "WALLET_PRIVATE_KEY",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			
			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
					return
				}
				
				configErr, ok := err.(*ConfigError)
				if !ok {
					t.Errorf("Expected ConfigError but got %T", err)
					return
				}
				
				if configErr.Field != tt.errorField {
					t.Errorf("Expected error field '%s', got '%s'", tt.errorField, configErr.Field)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}
			}
		})
	}
}

func TestConfigError(t *testing.T) {
	err := &ConfigError{
		Field:   "TEST_FIELD",
		Message: "test message",
	}
	
	expected := "config error: TEST_FIELD test message"
	if err.Error() != expected {
		t.Errorf("Expected error message '%s', got '%s'", expected, err.Error())
	}
}

func TestGetEnvFunctions(t *testing.T) {
	// Test getEnv
	os.Setenv("TEST_STRING", "test-value")
	defer os.Unsetenv("TEST_STRING")
	
	if result := getEnv("TEST_STRING", "default"); result != "test-value" {
		t.Errorf("Expected 'test-value', got '%s'", result)
	}
	
	if result := getEnv("NON_EXISTENT", "default"); result != "default" {
		t.Errorf("Expected 'default', got '%s'", result)
	}
	
	// Test getEnvInt
	os.Setenv("TEST_INT", "42")
	defer os.Unsetenv("TEST_INT")
	
	if result := getEnvInt("TEST_INT", 0); result != 42 {
		t.Errorf("Expected 42, got %d", result)
	}
	
	if result := getEnvInt("NON_EXISTENT", 10); result != 10 {
		t.Errorf("Expected 10, got %d", result)
	}
	
	// Test getEnvFloat
	os.Setenv("TEST_FLOAT", "3.14")
	defer os.Unsetenv("TEST_FLOAT")
	
	if result := getEnvFloat("TEST_FLOAT", 0.0); result != 3.14 {
		t.Errorf("Expected 3.14, got %f", result)
	}
	
	if result := getEnvFloat("NON_EXISTENT", 1.0); result != 1.0 {
		t.Errorf("Expected 1.0, got %f", result)
	}
	
	// Test getEnvBool
	os.Setenv("TEST_BOOL", "true")
	defer os.Unsetenv("TEST_BOOL")
	
	if result := getEnvBool("TEST_BOOL", false); result != true {
		t.Errorf("Expected true, got %t", result)
	}
	
	if result := getEnvBool("NON_EXISTENT", false); result != false {
		t.Errorf("Expected false, got %t", result)
	}
	
	// Test getEnvDuration
	os.Setenv("TEST_DURATION", "5s")
	defer os.Unsetenv("TEST_DURATION")
	
	if result := getEnvDuration("TEST_DURATION", 0); result != 5*time.Second {
		t.Errorf("Expected 5s, got %v", result)
	}
	
	if result := getEnvDuration("NON_EXISTENT", 1*time.Second); result != 1*time.Second {
		t.Errorf("Expected 1s, got %v", result)
	}
}