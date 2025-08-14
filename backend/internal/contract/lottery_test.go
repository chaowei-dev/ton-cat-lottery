package contract

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"ton-cat-lottery-backend/internal/config"
	"ton-cat-lottery-backend/internal/logger"
)

func TestGetContractInfo(t *testing.T) {
	// Mock server that returns valid contract info
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST method, got %s", r.Method)
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"ok": true,
			"result": {
				"stack": [
					["num", "5"],
					["num", "1"],
					["num", "0"],
					["num", "2"],
					["num", "3"]
				]
			}
		}`))
	}))
	defer server.Close()

	cfg := &config.Config{
		LotteryContractAddress: "EQTest123",
		APITimeout:             5 * time.Second,
		APIRateLimit:           100,
		APIMinInterval:         0,
		RetryAttempts:          1,
		IsTestnet:              true,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	// Replace the URL to use our test server
	client.config.IsTestnet = false // Force use of custom URL

	// We need to mock the request by overriding the makeRequest method
	// For this test, we'll test the parsing logic separately

	// Test parseContractInfoStack directly
	stack := [][]interface{}{
		{"num", "5"}, // currentRound
		{"num", "1"}, // lotteryActive (true)
		{"num", "0"}, // drawInProgress (false)
		{"num", "2"}, // participantCount
		{"num", "3"}, // maxParticipants
	}

	contractInfo, err := client.parseContractInfoStack(stack)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if contractInfo.CurrentRound != 5 {
		t.Errorf("Expected CurrentRound 5, got %d", contractInfo.CurrentRound)
	}

	if !contractInfo.LotteryActive {
		t.Errorf("Expected LotteryActive true, got %t", contractInfo.LotteryActive)
	}

	if contractInfo.DrawInProgress {
		t.Errorf("Expected DrawInProgress false, got %t", contractInfo.DrawInProgress)
	}

	if contractInfo.ParticipantCount != 2 {
		t.Errorf("Expected ParticipantCount 2, got %d", contractInfo.ParticipantCount)
	}

	if contractInfo.MaxParticipants != 3 {
		t.Errorf("Expected MaxParticipants 3, got %d", contractInfo.MaxParticipants)
	}
}

func TestParseContractInfoStackInvalidLength(t *testing.T) {
	cfg := &config.Config{}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	// Test with insufficient stack elements
	stack := [][]interface{}{
		{"num", "5"}, // Only 1 element, need at least 5
	}

	_, err := client.parseContractInfoStack(stack)
	if err == nil {
		t.Fatal("Expected error for insufficient stack elements")
	}
}

func TestParseStackInt(t *testing.T) {
	cfg := &config.Config{}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	tests := []struct {
		name        string
		stackItem   []interface{}
		expected    int
		expectError bool
	}{
		{
			name:        "Valid decimal number",
			stackItem:   []interface{}{"num", "123"},
			expected:    123,
			expectError: false,
		},
		{
			name:        "Valid hex number",
			stackItem:   []interface{}{"num", "0x1A"},
			expected:    26,
			expectError: false,
		},
		{
			name:        "Zero value",
			stackItem:   []interface{}{"num", "0"},
			expected:    0,
			expectError: false,
		},
		{
			name:        "Invalid format - too short",
			stackItem:   []interface{}{"num"},
			expected:    0,
			expectError: true,
		},
		{
			name:        "Invalid type",
			stackItem:   []interface{}{"slice", "123"},
			expected:    0,
			expectError: true,
		},
		{
			name:        "Invalid number format",
			stackItem:   []interface{}{"num", "abc"},
			expected:    0,
			expectError: true,
		},
		{
			name:        "Non-string value",
			stackItem:   []interface{}{"num", 123},
			expected:    0,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := client.parseStackInt(tt.stackItem)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got %v", err)
				}
				if result != tt.expected {
					t.Errorf("Expected %d, got %d", tt.expected, result)
				}
			}
		})
	}
}

func TestParseStackBool(t *testing.T) {
	cfg := &config.Config{}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	tests := []struct {
		name        string
		stackItem   []interface{}
		expected    bool
		expectError bool
	}{
		{
			name:        "True value (1)",
			stackItem:   []interface{}{"num", "1"},
			expected:    true,
			expectError: false,
		},
		{
			name:        "False value (0)",
			stackItem:   []interface{}{"num", "0"},
			expected:    false,
			expectError: false,
		},
		{
			name:        "True value (non-zero)",
			stackItem:   []interface{}{"num", "5"},
			expected:    true,
			expectError: false,
		},
		{
			name:        "Invalid format - too short",
			stackItem:   []interface{}{"num"},
			expected:    false,
			expectError: true,
		},
		{
			name:        "Invalid type",
			stackItem:   []interface{}{"slice", "1"},
			expected:    false,
			expectError: true,
		},
		{
			name:        "Invalid number format",
			stackItem:   []interface{}{"num", "abc"},
			expected:    false,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := client.parseStackBool(tt.stackItem)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error but got %v", err)
				}
				if result != tt.expected {
					t.Errorf("Expected %t, got %t", tt.expected, result)
				}
			}
		})
	}
}

func TestRetryLogicDemonstration(t *testing.T) {
	cfg := &config.Config{
		RetryAttempts:  3,
		RetryBaseDelay: 10 * time.Millisecond,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	attemptCount := 0
	ctx := context.Background()

	// Test that retry logic works - fails twice then succeeds
	err := client.retryWithBackoff(ctx, func() error {
		attemptCount++
		if attemptCount < 3 {
			return http.ErrServerClosed // Simulate temporary failure
		}
		return nil // Success on third attempt
	})

	if err != nil {
		t.Fatalf("Expected success after retries, got %v", err)
	}

	if attemptCount != 3 {
		t.Errorf("Expected exactly 3 attempts, got %d", attemptCount)
	}
}

func TestTONCenterRequestFormat(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify request format matches TonCenter API expectations
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}

		if r.Header.Get("User-Agent") != "ton-cat-lottery-backend/1.0" {
			t.Errorf("Expected User-Agent ton-cat-lottery-backend/1.0, got %s", r.Header.Get("User-Agent"))
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok": true, "result": {"stack": []}}`))
	}))
	defer server.Close()

	cfg := &config.Config{
		APITimeout:     5 * time.Second,
		APIRateLimit:   100,
		APIMinInterval: 0,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)

	ctx := context.Background()
	requestBody := TONCenterRequest{
		Address: "EQTest123",
		Method:  "getContractInfo",
		Stack:   []interface{}{},
	}

	_, err := client.makeRequest(ctx, "POST", server.URL, requestBody)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
}
