package lottery

import (
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

func createTestConfig() *config.Config {
	return &config.Config{
		Environment:            "test",
		LogLevel:               "debug",
		TONAPIEndpoint:         "https://testnet.toncenter.com/api/v2/",
		TONNetwork:             "testnet",
		LotteryContractAddress: "EQLotteryTest123",
		NFTContractAddress:     "EQNFTTest456",
		WalletPrivateKey:       "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
		DrawInterval:           1 * time.Second, // 短間隔用於測試
		MaxParticipants:        10,
		MinParticipants:        2,
		EntryFeeTON:            0.1,
		AutoDraw:               true,
		RetryCount:             3,
		RetryDelay:             100 * time.Millisecond,
	}
}

func createMockServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var response ton.APIResponse

		if strings.Contains(r.URL.Path, "runGetMethod") {
			// Mock contract info response
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"owner": "EQOwner123",
					"entry_fee": 100000000,
					"max_participants": 10,
					"current_round": 1,
					"lottery_active": true,
					"participant_count": 3,
					"nft_contract": "EQNFTTest456"
				}`),
			}
		} else if strings.Contains(r.URL.Path, "sendBoc") {
			// Mock send transaction response
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`{
					"hash": "0x123456789abcdef"
				}`),
			}
		} else if strings.Contains(r.URL.Path, "getTransactions") {
			// Mock transaction status response
			response = ton.APIResponse{
				Ok: true,
				Result: json.RawMessage(`[{
					"hash": "0x123456789abcdef",
					"success": true
				}]`),
			}
		} else {
			// Default response
			response = ton.APIResponse{
				Ok:     true,
				Result: json.RawMessage(`{}`),
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}))
}

func TestNewService(t *testing.T) {
	cfg := createTestConfig()
	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	if service == nil {
		t.Fatal("Expected service to be created, got nil")
	}

	if service.config != cfg {
		t.Error("Expected config to be set")
	}

	if service.logger == nil {
		t.Error("Expected logger to be set")
	}

	if service.tonClient == nil {
		t.Error("Expected tonClient to be set")
	}

	if service.wallet == nil {
		t.Error("Expected wallet to be set")
	}

	if service.txMonitor == nil {
		t.Error("Expected txMonitor to be set")
	}

	if service.running {
		t.Error("Expected service to not be running initially")
	}
}

func TestServiceStartStop(t *testing.T) {
	cfg := createTestConfig()
	cfg.AutoDraw = false // 關閉自動抽獎以簡化測試
	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	// 測試啟動
	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}

	if !service.running {
		t.Error("Expected service to be running after Start()")
	}

	// 測試重複啟動
	err = service.Start()
	if err == nil {
		t.Fatal("Expected Start() to fail when already running")
	}

	// 測試停止
	service.Stop()

	if service.running {
		t.Error("Expected service to not be running after Stop()")
	}

	// 測試重複停止（應該不會出錯）
	service.Stop()
}

func TestServiceAutoDrawLoop(t *testing.T) {
	server := createMockServer()
	defer server.Close()

	cfg := createTestConfig()
	cfg.TONAPIEndpoint = server.URL + "/"
	cfg.AutoDraw = true
	cfg.DrawInterval = 200 * time.Millisecond // 短間隔
	cfg.MinParticipants = 1                   // 降低最小參與人數以便觸發抽獎

	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	// 啟動服務
	err = service.Start()
	if err != nil {
		t.Fatalf("Start() failed: %v", err)
	}

	// 等待足夠時間讓自動抽獎循環至少執行一次
	time.Sleep(500 * time.Millisecond)

	// 停止服務
	service.Stop()

	// 驗證服務已停止
	if service.running {
		t.Error("Expected service to be stopped")
	}
}

func TestGetContractInfo(t *testing.T) {
	server := createMockServer()
	defer server.Close()

	cfg := createTestConfig()
	cfg.TONAPIEndpoint = server.URL + "/"
	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	contractInfo, err := service.GetContractInfo()
	if err != nil {
		t.Fatalf("GetContractInfo() failed: %v", err)
	}

	if contractInfo.Owner != "EQOwner123" {
		t.Errorf("Expected owner='EQOwner123', got %s", contractInfo.Owner)
	}

	if contractInfo.CurrentRound != 1 {
		t.Errorf("Expected current_round=1, got %d", contractInfo.CurrentRound)
	}

	if !contractInfo.LotteryActive {
		t.Error("Expected lottery_active=true")
	}

	if contractInfo.ParticipantCount != 3 {
		t.Errorf("Expected participant_count=3, got %d", contractInfo.ParticipantCount)
	}
}

func TestSendDrawWinner(t *testing.T) {
	t.Run("successful draw", func(t *testing.T) {
		server := createMockServer()
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		cfg.MinParticipants = 2 // 設定最小參與人數
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.SendDrawWinner()
		if err != nil {
			t.Fatalf("SendDrawWinner() failed: %v", err)
		}
	})

	t.Run("lottery not active", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.URL.Path, "runGetMethod") {
				response := ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": false,
						"participant_count": 3,
						"nft_contract": "EQNFTTest456"
					}`),
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}
		}))
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.SendDrawWinner()
		if err == nil {
			t.Fatal("Expected SendDrawWinner() to fail when lottery not active")
		}

		if !strings.Contains(err.Error(), "抽獎未活躍") {
			t.Errorf("Expected error to contain '抽獎未活躍', got: %v", err)
		}
	})

	t.Run("insufficient participants", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.URL.Path, "runGetMethod") {
				response := ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 1,
						"nft_contract": "EQNFTTest456"
					}`),
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}
		}))
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		cfg.MinParticipants = 2
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.SendDrawWinner()
		if err == nil {
			t.Fatal("Expected SendDrawWinner() to fail with insufficient participants")
		}

		if !strings.Contains(err.Error(), "參與人數不足") {
			t.Errorf("Expected error to contain '參與人數不足', got: %v", err)
		}
	})
}

func TestSendStartNewRound(t *testing.T) {
	t.Run("successful start new round", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var response ton.APIResponse

			if strings.Contains(r.URL.Path, "runGetMethod") {
				// 返回抽獎未活躍的狀態
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": false,
						"participant_count": 0,
						"nft_contract": "EQNFTTest456"
					}`),
				}
			} else if strings.Contains(r.URL.Path, "sendBoc") {
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

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.SendStartNewRound()
		if err != nil {
			t.Fatalf("SendStartNewRound() failed: %v", err)
		}
	})

	t.Run("lottery still active", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.URL.Path, "runGetMethod") {
				response := ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 3,
						"nft_contract": "EQNFTTest456"
					}`),
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}
		}))
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.SendStartNewRound()
		if err == nil {
			t.Fatal("Expected SendStartNewRound() to fail when lottery is still active")
		}

		if !strings.Contains(err.Error(), "當前抽獎仍在進行中") {
			t.Errorf("Expected error to contain '當前抽獎仍在進行中', got: %v", err)
		}
	})
}

func TestCheckAndDraw(t *testing.T) {
	t.Run("should draw when max participants reached", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var response ton.APIResponse

			if strings.Contains(r.URL.Path, "runGetMethod") {
				response = ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 10,
						"nft_contract": "EQNFTTest456"
					}`),
				}
			} else if strings.Contains(r.URL.Path, "sendBoc") {
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

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		cfg.MaxParticipants = 10
		cfg.MinParticipants = 2
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.checkAndDraw()
		if err != nil {
			t.Fatalf("checkAndDraw() failed: %v", err)
		}
	})

	t.Run("should not draw when insufficient participants", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.URL.Path, "runGetMethod") {
				response := ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": true,
						"participant_count": 1,
						"nft_contract": "EQNFTTest456"
					}`),
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}
		}))
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		cfg.MinParticipants = 2
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.checkAndDraw()
		if err != nil {
			t.Fatalf("checkAndDraw() should not fail when conditions not met: %v", err)
		}
	})

	t.Run("should not draw when lottery inactive", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.Contains(r.URL.Path, "runGetMethod") {
				response := ton.APIResponse{
					Ok: true,
					Result: json.RawMessage(`{
						"owner": "EQOwner123",
						"entry_fee": 100000000,
						"max_participants": 10,
						"current_round": 1,
						"lottery_active": false,
						"participant_count": 5,
						"nft_contract": "EQNFTTest456"
					}`),
				}
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(response)
			}
		}))
		defer server.Close()

		cfg := createTestConfig()
		cfg.TONAPIEndpoint = server.URL + "/"
		log := logger.New(cfg.LogLevel)

		service, err := NewService(cfg, log)
		if err != nil {
			t.Fatalf("NewService() failed: %v", err)
		}

		err = service.checkAndDraw()
		if err != nil {
			t.Fatalf("checkAndDraw() should not fail when lottery inactive: %v", err)
		}
	})
}

func TestGetStatus(t *testing.T) {
	cfg := createTestConfig()
	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	status := service.GetStatus()

	if status["running"] != false {
		t.Errorf("Expected running=false, got %v", status["running"])
	}

	if status["auto_draw"] != cfg.AutoDraw {
		t.Errorf("Expected auto_draw=%v, got %v", cfg.AutoDraw, status["auto_draw"])
	}

	if status["max_participants"] != cfg.MaxParticipants {
		t.Errorf("Expected max_participants=%d, got %v", cfg.MaxParticipants, status["max_participants"])
	}

	if status["min_participants"] != cfg.MinParticipants {
		t.Errorf("Expected min_participants=%d, got %v", cfg.MinParticipants, status["min_participants"])
	}

	if status["entry_fee_ton"] != cfg.EntryFeeTON {
		t.Errorf("Expected entry_fee_ton=%f, got %v", cfg.EntryFeeTON, status["entry_fee_ton"])
	}
}

func TestGetWalletAddress(t *testing.T) {
	cfg := createTestConfig()
	log := logger.New(cfg.LogLevel)

	service, err := NewService(cfg, log)
	if err != nil {
		t.Fatalf("NewService() failed: %v", err)
	}

	address := service.GetWalletAddress()
	if address == "" {
		t.Error("Expected non-empty wallet address")
	}

	if !strings.HasPrefix(address, "EQ") {
		t.Errorf("Expected address to start with 'EQ', got %s", address)
	}
}
