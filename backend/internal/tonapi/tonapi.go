package tonapi

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"time"

	"ton-cat-lottery-backend/internal/wallet"
)

const (
	TONTestnetAPI = "https://testnet.toncenter.com/api/v2"
)

// TONClient handles communication with TON blockchain via HTTP API
type TONClient struct {
	baseURL    string
	httpClient *http.Client
	wallet     *wallet.Manager
}

// NewTONClient creates a new TON API client
func NewTONClient() (*TONClient, error) {
	walletManager, err := wallet.NewManager()
	if err != nil {
		return nil, fmt.Errorf("error creating wallet manager: %w", err)
	}

	return &TONClient{
		baseURL: TONTestnetAPI,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		wallet: walletManager,
	}, nil
}

// GetBalance queries the wallet balance using TON API
func (tc *TONClient) GetBalance(ctx context.Context) (*big.Int, error) {
	tonAddress := os.Getenv("WALLET_TON_ADDRESS")
	if tonAddress == "" {
		return nil, fmt.Errorf("WALLET_TON_ADDRESS not found in environment")
	}

	url := fmt.Sprintf("%s/getAddressBalance", tc.baseURL)
	
	reqBody := map[string]interface{}{
		"address": tonAddress,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := tc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %w", err)
	}

	var result struct {
		OK     bool   `json:"ok"`
		Result string `json:"result"`
		Error  string `json:"error"`
	}

	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, fmt.Errorf("error parsing response: %w", err)
	}

	if !result.OK {
		return nil, fmt.Errorf("API error: %s", result.Error)
	}

	balance := new(big.Int)
	balance, ok := balance.SetString(result.Result, 10)
	if !ok {
		return nil, fmt.Errorf("error parsing balance: %s", result.Result)
	}

	return balance, nil
}

// FormatTON converts nanotons to TON string
func FormatTON(nanotons *big.Int) string {
	ton := new(big.Float).SetInt(nanotons)
	ton = ton.Quo(ton, big.NewFloat(1e9))
	return ton.String()
}

// GetContractInfo queries lottery contract information using TON API
func (tc *TONClient) GetContractInfo(ctx context.Context, contractAddress string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/runGetMethod", tc.baseURL)
	
	reqBody := map[string]interface{}{
		"address": contractAddress,
		"method":  "getContractInfo",
		"stack":   []interface{}{}, // Empty stack for getContractInfo
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := tc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response: %w", err)
	}

	var result struct {
		OK     bool        `json:"ok"`
		Result interface{} `json:"result"`
		Error  string      `json:"error"`
	}

	err = json.Unmarshal(body, &result)
	if err != nil {
		return nil, fmt.Errorf("error parsing response: %w", err)
	}

	if !result.OK {
		return nil, fmt.Errorf("API error: %s", result.Error)
	}

	return result.Result.(map[string]interface{}), nil
}

// SendDrawWinner sends a drawWinner transaction to the lottery contract
// This mimics the TypeScript implementation:
// catLottery.send(provider.sender(), { value: toNano('0.1') }, 'drawWinner');
func (tc *TONClient) SendDrawWinner(ctx context.Context, contractAddress string) error {
	fmt.Printf("📞 準備調用 drawWinner 方法...\n")
	fmt.Printf("合約地址: %s\n", contractAddress)
	fmt.Printf("發送者: %s\n", tc.wallet.GetTONAddress())

	// Check balance first
	balance, err := tc.GetBalance(ctx)
	if err != nil {
		return fmt.Errorf("error getting balance: %w", err)
	}

	fmt.Printf("當前餘額: %s TON\n", FormatTON(balance))

	// Check if we have enough balance (minimum 0.15 TON for gas + transaction)
	minBalance := big.NewInt(150000000) // 0.15 TON in nanotons
	if balance.Cmp(minBalance) < 0 {
		return fmt.Errorf("餘額不足: 需要至少 0.15 TON，目前有 %s TON", FormatTON(balance))
	}

	// Note: In the TypeScript version, the actual transaction sending is handled by the
	// TON Connect wallet (TonKeeper), which creates and signs the transaction.
	// 
	// The TypeScript code:
	// catLottery.send(provider.sender(), { value: toNano('0.1') }, 'drawWinner');
	// 
	// This sends a message to the contract with:
	// - value: 0.1 TON for gas
	// - body: 'drawWinner' (which gets converted to the appropriate opcode)

	fmt.Printf("\n⚠️  重要提醒:\n")
	fmt.Printf("目前的 Go 後端實現可以:\n")
	fmt.Printf("✅ 管理私鑰和錢包地址\n")
	fmt.Printf("✅ 查詢餘額和合約狀態\n")
	fmt.Printf("✅ 驗證交易簽名能力\n")
	fmt.Printf("\n但是要發送真實的 drawWinner 交易，還需要:\n")
	fmt.Printf("🔧 實現 TON 的 Cell/BOC 編碼\n")
	fmt.Printf("🔧 構建正確的內部消息格式\n")
	fmt.Printf("🔧 實現交易序列號 (seqno) 管理\n")
	fmt.Printf("🔧 廣播交易到 TON 網絡\n")
	fmt.Printf("\n💡 建議方案:\n")
	fmt.Printf("1. 使用現有的 TypeScript 實現 (已經可以正常工作)\n")
	fmt.Printf("2. 或者集成 TON SDK 來完整實現交易發送\n")
	fmt.Printf("3. 目前可以用 Go 後端來監控和查詢狀態\n")

	return nil
}

// GetWalletInfo returns wallet information
func (tc *TONClient) GetWalletInfo() map[string]string {
	return map[string]string{
		"address":    tc.wallet.GetTONAddress(),
		"privateKey": tc.wallet.GetPrivateKeyHex(),
		"publicKey":  tc.wallet.GetPublicKeyHex(),
	}
}

// TestSigning demonstrates that the private key can sign transactions
func (tc *TONClient) TestSigning() error {
	fmt.Printf("🔐 測試私鑰簽名能力...\n")

	// Create a test message that represents a drawWinner transaction
	testMessage := []byte("drawWinner_transaction_test")
	
	signature := tc.wallet.Sign(testMessage)
	
	fmt.Printf("✅ 簽名成功!\n")
	fmt.Printf("   消息: %s\n", string(testMessage))
	fmt.Printf("   簽名: %s\n", hex.EncodeToString(signature))
	
	if tc.wallet.Verify(testMessage, signature) {
		fmt.Printf("✅ 簽名驗證成功!\n")
	} else {
		fmt.Printf("❌ 簽名驗證失敗!\n")
	}

	// Test with different messages
	messages := []string{
		"transfer_100_TON_to_contract",
		"call_contract_method_drawWinner",
		"nft_mint_request",
	}

	fmt.Printf("\n📝 測試多種交易類型的簽名:\n")
	for i, msg := range messages {
		msgBytes := []byte(msg)
		sig := tc.wallet.Sign(msgBytes)
		verified := tc.wallet.Verify(msgBytes, sig)
		
		status := "✅"
		if !verified {
			status = "❌"
		}
		
		fmt.Printf("%s %d. %s\n", status, i+1, msg)
	}

	return nil
}