package lottery

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/internal/ton"
	"ton-cat-lottery-backend/pkg/logger"
)

// TestLotteryFlow 測試完整的抽獎流程
func TestLotteryFlow(t *testing.T) {
	// 創建模擬的 TON API 服務器
	callCount := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		var response ton.APIResponse

		if strings.Contains(r.URL.Path, "runGetMethod") {
			// 模擬合約狀態查詢
			if callCount <= 2 {
				// 初始狀態：抽獎活躍，參與者不足
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 5,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 1,
						"nft_contract": "EQNFTTest456"
					}`),
				}
			} else if callCount <= 4 {
				// 中間狀態：達到最小參與者數量
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 5,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 5,
						"nft_contract": "EQNFTTest456"
					}`),
				}
			} else if strings.Contains(r.RequestURI, "getWinner") {
				// 查詢中獎者
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"winner": "EQWinner123",
						"nft_id": 42,
						"timestamp": 1640995200
					}`),
				}
			} else {
				// 抽獎完成後：抽獎未活躍
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 5,
						"current_round": 2,
						"lottery_active": false,
						"participant_count": 0,
						"nft_contract": "EQNFTTest456"
					}`),
				}
			}
		} else if strings.Contains(r.URL.Path, "sendBoc") {
			// 模擬交易發送
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"hash": "0x123456789abcdef"
				}`),
			}
		} else if strings.Contains(r.URL.Path, "getTransactions") {
			// 模擬交易狀態查詢
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`[{
					"hash": "0x123456789abcdef",
					"success": true
				}]`),
			}
		} else {
			// 默認回應
			response = ton.APIResponse{
				Ok:     true,
				Result: json.RawMessage(`{}`),
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	// 創建測試配置
	cfg := &config.Config{
		Environment:            "test",
		LogLevel:               "debug",
		TONAPIEndpoint:         server.URL + "/",
		TONNetwork:             "testnet",
		LotteryContractAddress: "EQLotteryTest123",
		NFTContractAddress:     "EQNFTTest456",
		WalletPrivateKey:       "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		DrawInterval:           100 * time.Millisecond,
		MaxParticipants:        5,
		MinParticipants:        2,
		EntryFeeTON:            0.1,
		AutoDraw:               false, // 手動控制抽獎
		RetryCount:             3,
		RetryDelay:             50 * time.Millisecond,
	}

	log := logger.New(cfg.LogLevel)

	// 創建抽獎服務
	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	// 啟動服務（但不啟用自動抽獎）
	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}
	defer service.Stop()

	// 步驟1：查詢初始合約狀態
	t.Log("步驟1：查詢初始合約狀態")
	contractInfo, err := service.GetContractInfo()
	if err != nil {
		t.Fatalf("GetContractInfo() failed: %v", err)
	}

	if !contractInfo.LotteryActive {
		t.Error("Expected lottery to be active initially")
	}

	if contractInfo.ParticipantCount >= cfg.MinParticipants {
		t.Errorf("Expected participant count (%d) to be less than min (%d) initially",
			contractInfo.ParticipantCount, cfg.MinParticipants)
	}

	// 步驟2：嘗試在參與者不足時抽獎（應該失敗）
	t.Log("步驟2：測試參與者不足時的抽獎")
	err = service.SendDrawWinner()
	if err == nil {
		t.Fatal("Expected SendDrawWinner() to fail with insufficient participants")
	}

	if !strings.Contains(err.Error(), "參與人數不足") {
		t.Errorf("Expected error about insufficient participants, got: %v", err)
	}

	// 步驟3：模擬參與者達到條件後執行抽獎
	t.Log("步驟3：參與者達到條件後執行抽獎")
	// 注意：由於 callCount 會增加，模擬服務器會返回足夠的參與者數量

	err = service.SendDrawWinner()
	if err != nil {
		t.Fatalf("SendDrawWinner() failed when participants sufficient: %v", err)
	}

	// 步驟4：查詢中獎結果
	t.Log("步驟4：查詢中獎結果")
	winner, err := service.GetWinner(1)
	if err != nil {
		t.Fatalf("GetWinner() failed: %v", err)
	}

	if winner.Winner != "EQWinner123" {
		t.Errorf("Expected winner='EQWinner123', got %s", winner.Winner)
	}

	if winner.NFTId != 42 {
		t.Errorf("Expected NFT ID=42, got %d", winner.NFTId)
	}

	// 步驟5：開始新輪次
	t.Log("步驟5：開始新輪次")
	err = service.SendStartNewRound()
	if err != nil {
		t.Fatalf("SendStartNewRound() failed: %v", err)
	}

	// 步驟6：驗證服務狀態
	t.Log("步驟6：驗證服務狀態")
	status := service.GetStatus()
	if !status["running"].(bool) {
		t.Error("Expected service to be running")
	}

	walletAddress := service.GetWalletAddress()
	if walletAddress == "" {
		t.Error("Expected non-empty wallet address")
	}

	balance, err := service.GetContractBalance()
	if err != nil {
		t.Fatalf("GetContractBalance() failed: %v", err)
	}
	_ = balance // 餘額可能為任何值，只要不出錯即可

	t.Log("✅ 完整抽獎流程測試成功")
}

// TestAutoDrawFlow 測試自動抽獎流程
func TestAutoDrawFlow(t *testing.T) {
	drawExecuted := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var response ton.APIResponse

		if strings.Contains(r.URL.Path, "runGetMethod") {
			// 總是返回達到最大參與者數量的狀態
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"owner": "EQOwner123",
					"entry_fee": 100000000,
					"max_participants": 3,
					"current_round": 1,
					"lottery_active": true,
					"participant_count": 3,
					"nft_contract": "EQNFTTest456"
				}`),
			}
		} else if strings.Contains(r.URL.Path, "sendBoc") {
			// 標記抽獎已執行
			drawExecuted = true
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"hash": "0x123456789abcdef"
				}`),
			}
		} else if strings.Contains(r.URL.Path, "getTransactions") {
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`[{
					"hash": "0x123456789abcdef",
					"success": true
				}]`),
			}
		} else if strings.Contains(r.RequestURI, "getWinner") {
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"winner": "EQAutoWinner123",
					"nft_id": 99,
					"timestamp": 1640995200
				}`),
			}
		} else {
			response = ton.APIResponse{
				Ok:     true,
				Result: json.RawMessage(`{}`),
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		Environment:            "test",
		LogLevel:               "debug",
		TONAPIEndpoint:         server.URL + "/",
		TONNetwork:             "testnet",
		LotteryContractAddress: "EQLotteryTest123",
		NFTContractAddress:     "EQNFTTest456",
		WalletPrivateKey:       "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		DrawInterval:           200 * time.Millisecond, // 短間隔用於測試
		MaxParticipants:        3,
		MinParticipants:        2,
		EntryFeeTON:            0.1,
		AutoDraw:               true, // 啟用自動抽獎
		RetryCount:             3,
		RetryDelay:             50 * time.Millisecond,
	}

	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	// 啟動服務（自動抽獎將被啟用）
	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}

	// 等待足夠時間讓自動抽獎執行
	time.Sleep(1 * time.Second)

	// 停止服務
	service.Stop()

	// 驗證自動抽獎是否執行
	if !drawExecuted {
		t.Error("Expected auto draw to be executed")
	}

	t.Log("✅ 自動抽獎流程測試成功")
}

// TestErrorHandling 測試錯誤處理
func TestErrorHandling(t *testing.T) {
	// 創建會返回錯誤的服務器
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response := ton.APIResponse{
			Ok:    false,
			Error: "Network error",
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
	defer server.Close()

	cfg := &config.Config{
		Environment:            "test",
		LogLevel:               "debug",
		TONAPIEndpoint:         server.URL + "/",
		TONNetwork:             "testnet",
		LotteryContractAddress: "EQLotteryTest123",
		NFTContractAddress:     "EQNFTTest456",
		WalletPrivateKey:       "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		DrawInterval:           1 * time.Second,
		MaxParticipants:        5,
		MinParticipants:        2,
		EntryFeeTON:            0.1,
		AutoDraw:               false,
		RetryCount:             2, // 減少重試次數以加快測試
		RetryDelay:             50 * time.Millisecond,
	}

	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}
	defer service.Stop()

	// 測試各種操作的錯誤處理
	_, err = service.GetContractInfo()
	if err == nil {
		t.Error("Expected GetContractInfo() to fail with network error")
	}

	err = service.SendDrawWinner()
	if err == nil {
		t.Error("Expected SendDrawWinner() to fail with network error")
	}

	err = service.SendStartNewRound()
	if err == nil {
		t.Error("Expected SendStartNewRound() to fail with network error")
	}

	_, err = service.GetParticipant(0)
	if err == nil {
		t.Error("Expected GetParticipant() to fail with network error")
	}

	_, err = service.GetWinner(1)
	if err == nil {
		t.Error("Expected GetWinner() to fail with network error")
	}

	_, err = service.GetContractBalance()
	if err == nil {
		t.Error("Expected GetContractBalance() to fail with network error")
	}

	t.Log("✅ 錯誤處理測試成功")
}

// TestConcurrentOperations 測試並發操作
func TestConcurrentOperations(t *testing.T) {
	server := createMockServer()
	defer server.Close()

	cfg := &config.Config{
		Environment:            "test",
		LogLevel:               "debug",
		TONAPIEndpoint:         server.URL + "/",
		TONNetwork:             "testnet",
		LotteryContractAddress: "EQLotteryTest123",
		NFTContractAddress:     "EQNFTTest456",
		WalletPrivateKey:       "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		DrawInterval:           1 * time.Second,
		MaxParticipants:        5,
		MinParticipants:        2,
		EntryFeeTON:            0.1,
		AutoDraw:               false,
		RetryCount:             3,
		RetryDelay:             50 * time.Millisecond,
	}

	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}
	defer service.Stop()

	// 並發執行多個查詢操作
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	done := make(chan error, 10)

	// 啟動多個 goroutine 同時執行操作
	for i := 0; i < 10; i++ {
		go func(id int) {
			var err error
			switch id % 4 {
			case 0:
				_, err = service.GetContractInfo()
			case 1:
				_, err = service.GetContractBalance()
			case 2:
				_ = service.GetStatus()
			case 3:
				_ = service.GetWalletAddress()
			}
			done <- err
		}(i)
	}

	// 等待所有操作完成
	for i := 0; i < 10; i++ {
		select {
		case err := <-done:
			if err != nil {
				t.Errorf("Concurrent operation %d failed: %v", i, err)
			}
		case <-ctx.Done():
			t.Fatal("Concurrent operations timed out")
		}
	}

	t.Log("✅ 並發操作測試成功")
}
