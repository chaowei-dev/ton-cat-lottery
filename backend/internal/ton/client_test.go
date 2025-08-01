package ton

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/pkg/logger"
)

func TestNewClient(t *testing.T) {
	cfg := &config.Config{
		TONAPIEndpoint: "https://testnet.toncenter.com/api/v2/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	if client == nil {
		t.Fatal("Expected client to be created, got nil")
	}

	if client.baseURL != cfg.TONAPIEndpoint {
		t.Errorf("Expected baseURL=%s, got %s", cfg.TONAPIEndpoint, client.baseURL)
	}

	if client.httpClient == nil {
		t.Error("Expected http client to be initialized")
	}

	if client.httpClient.Timeout != 30*time.Second {
		t.Errorf("Expected timeout=30s, got %v", client.httpClient.Timeout)
	}
}

func TestGetContractInfo(t *testing.T) {
	// 創建 mock HTTP 服務
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "getAddressInformation") {
			t.Errorf("Expected URL to contain 'getAddressInformation', got %s", r.URL.Path)
		}

		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"address": "EQTest123",
				"balance": "1000000000",
				"state": "active"
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	contractInfo, err := client.GetContractInfo(ctx, "EQTest123")
	if err != nil {
		t.Fatalf("GetContractInfo() failed: %v", err)
	}

	if contractInfo.Address != "EQTest123" {
		t.Errorf("Expected address='EQTest123', got %s", contractInfo.Address)
	}

	if contractInfo.Balance != "1000000000" {
		t.Errorf("Expected balance='1000000000', got %s", contractInfo.Balance)
	}

	if contractInfo.State != "active" {
		t.Errorf("Expected state='active', got %s", contractInfo.State)
	}
}

func TestSendTransaction(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "sendBoc") {
			t.Errorf("Expected URL to contain 'sendBoc', got %s", r.URL.Path)
		}

		if r.Method != "POST" {
			t.Errorf("Expected POST method, got %s", r.Method)
		}

		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"hash": "0x123456789abcdef"
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	transaction := []byte("test transaction")
	hash, err := client.SendTransaction(ctx, transaction)
	if err != nil {
		t.Fatalf("SendTransaction() failed: %v", err)
	}

	if hash != "0x123456789abcdef" {
		t.Errorf("Expected hash='0x123456789abcdef', got %s", hash)
	}
}

func TestGetTransactionStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "getTransactions") {
			t.Errorf("Expected URL to contain 'getTransactions', got %s", r.URL.Path)
		}

		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`[{
				"hash": "0x123456789abcdef",
				"success": true
			}]`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	status, err := client.GetTransactionStatus(ctx, "0x123456789abcdef")
	if err != nil {
		t.Fatalf("GetTransactionStatus() failed: %v", err)
	}

	if status != "success" {
		t.Errorf("Expected status='success', got %s", status)
	}
}

func TestGetTransactionStatusPending(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok:     true,
			Result: json.RawMessage(`[]`), // 空數組表示未找到交易
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	status, err := client.GetTransactionStatus(ctx, "0x123456789abcdef")
	if err != nil {
		t.Fatalf("GetTransactionStatus() failed: %v", err)
	}

	if status != "pending" {
		t.Errorf("Expected status='pending', got %s", status)
	}
}

func TestRunGetMethod(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "runGetMethod") {
			t.Errorf("Expected URL to contain 'runGetMethod', got %s", r.URL.Path)
		}

		if r.Method != "POST" {
			t.Errorf("Expected POST method, got %s", r.Method)
		}

		// 驗證請求體
		var requestBody map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			t.Fatalf("Failed to decode request body: %v", err)
		}

		if requestBody["method"] != "getContractInfo" {
			t.Errorf("Expected method='getContractInfo', got %v", requestBody["method"])
		}

		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"owner": "EQOwner123",
				"entry_fee": 100000000,
				"current_round": 1,
				"lottery_active": true,
				"participant_count": 5
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	result, err := client.RunGetMethod(ctx, "EQContract123", "getContractInfo", []interface{}{})
	if err != nil {
		t.Fatalf("RunGetMethod() failed: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(result, &parsed); err != nil {
		t.Fatalf("Failed to parse result: %v", err)
	}

	if parsed["owner"] != "EQOwner123" {
		t.Errorf("Expected owner='EQOwner123', got %v", parsed["owner"])
	}
}

func TestGetLotteryContractInfo(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"owner": "EQOwner123",
				"entry_fee": 100000000,
				"max_participants": 10,
				"current_round": 1,
				"lottery_active": true,
				"participant_count": 5,
				"nft_contract": "EQNFTContract456"
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	contractInfo, err := client.GetLotteryContractInfo(ctx, "EQContract123")
	if err != nil {
		t.Fatalf("GetLotteryContractInfo() failed: %v", err)
	}

	if contractInfo.Owner != "EQOwner123" {
		t.Errorf("Expected owner='EQOwner123', got %s", contractInfo.Owner)
	}

	if contractInfo.EntryFee != 100000000 {
		t.Errorf("Expected entry_fee=100000000, got %d", contractInfo.EntryFee)
	}

	if contractInfo.MaxParticipants != 10 {
		t.Errorf("Expected max_participants=10, got %d", contractInfo.MaxParticipants)
	}

	if contractInfo.CurrentRound != 1 {
		t.Errorf("Expected current_round=1, got %d", contractInfo.CurrentRound)
	}

	if !contractInfo.LotteryActive {
		t.Error("Expected lottery_active=true, got false")
	}

	if contractInfo.ParticipantCount != 5 {
		t.Errorf("Expected participant_count=5, got %d", contractInfo.ParticipantCount)
	}

	if contractInfo.NFTContract != "EQNFTContract456" {
		t.Errorf("Expected nft_contract='EQNFTContract456', got %s", contractInfo.NFTContract)
	}
}

func TestGetParticipant(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"address": "EQParticipant123",
				"amount": 100000000,
				"timestamp": 1640995200
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	participant, err := client.GetParticipant(ctx, "EQContract123", 0)
	if err != nil {
		t.Fatalf("GetParticipant() failed: %v", err)
	}

	if participant.Address != "EQParticipant123" {
		t.Errorf("Expected address='EQParticipant123', got %s", participant.Address)
	}

	if participant.Amount != 100000000 {
		t.Errorf("Expected amount=100000000, got %d", participant.Amount)
	}

	if participant.Timestamp != 1640995200 {
		t.Errorf("Expected timestamp=1640995200, got %d", participant.Timestamp)
	}
}

func TestGetWinner(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok: true,
			Result: json.RawMessage(`{
				"winner": "EQWinner123",
				"nft_id": 42,
				"timestamp": 1640995200
			}`),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	winner, err := client.GetWinner(ctx, "EQContract123", 1)
	if err != nil {
		t.Fatalf("GetWinner() failed: %v", err)
	}

	if winner.Winner != "EQWinner123" {
		t.Errorf("Expected winner='EQWinner123', got %s", winner.Winner)
	}

	if winner.NFTId != 42 {
		t.Errorf("Expected nft_id=42, got %d", winner.NFTId)
	}

	if winner.Timestamp != 1640995200 {
		t.Errorf("Expected timestamp=1640995200, got %d", winner.Timestamp)
	}
}

func TestGetContractBalance(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok:     true,
			Result: json.RawMessage(`5000000000`), // 5 TON
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	balance, err := client.GetContractBalance(ctx, "EQContract123")
	if err != nil {
		t.Fatalf("GetContractBalance() failed: %v", err)
	}

	if balance != 5000000000 {
		t.Errorf("Expected balance=5000000000, got %d", balance)
	}
}

func TestMakeRequestError(t *testing.T) {
	// 測試 API 錯誤回應
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := APIResponse{
			Ok:    false,
			Error: "Contract not found",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		TONAPIEndpoint: server.URL + "/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	_, err := client.GetContractInfo(ctx, "EQNonExistent")
	if err == nil {
		t.Fatal("Expected GetContractInfo() to fail with API error")
	}

	if !strings.Contains(err.Error(), "Contract not found") {
		t.Errorf("Expected error to contain 'Contract not found', got: %v", err)
	}
}

func TestMakeRequestNetworkError(t *testing.T) {
	// 測試網路錯誤
	cfg := &config.Config{
		TONAPIEndpoint: "http://nonexistent-server.com/",
		LogLevel:       "debug",
	}
	log := logger.New(cfg.LogLevel)

	client := NewClient(cfg, log)
	ctx := context.Background()

	_, err := client.GetContractInfo(ctx, "EQTest123")
	if err == nil {
		t.Fatal("Expected GetContractInfo() to fail with network error")
	}
}
