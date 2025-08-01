package ton

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"ton-cat-lottery-backend/config"
	"ton-cat-lottery-backend/pkg/logger"
)

// Client TON API 客戶端
type Client struct {
	config     *config.Config
	logger     *logger.Logger
	httpClient *http.Client
	baseURL    string
}

// APIResponse API 回應格式
type APIResponse struct {
	Ok     bool            `json:"ok"`
	Result json.RawMessage `json:"result"`
	Error  string          `json:"error,omitempty"`
}

// ContractInfo 合約資訊
type ContractInfo struct {
	Address string `json:"address"`
	Balance string `json:"balance"`
	State   string `json:"state"`
}

// NewClient 創建新的 TON 客戶端
func NewClient(cfg *config.Config, log *logger.Logger) *Client {
	return &Client{
		config: cfg,
		logger: log.WithGroup("ton_client"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: cfg.TONAPIEndpoint,
	}
}

// GetContractInfo 獲取合約資訊
func (c *Client) GetContractInfo(ctx context.Context, contractAddress string) (*ContractInfo, error) {
	c.logger.Debug("查詢合約資訊", "address", contractAddress)

	// 構建請求 URL
	url := fmt.Sprintf("%sgetAddressInformation", c.baseURL)
	
	// 構建請求參數
	params := map[string]interface{}{
		"address": contractAddress,
	}

	// 發送請求
	resp, err := c.makeRequest(ctx, "GET", url, params)
	if err != nil {
		return nil, fmt.Errorf("查詢合約資訊失敗: %w", err)
	}

	var contractInfo ContractInfo
	if err := json.Unmarshal(resp.Result, &contractInfo); err != nil {
		return nil, fmt.Errorf("解析合約資訊失敗: %w", err)
	}

	c.logger.Debug("合約資訊查詢成功", 
		"address", contractInfo.Address,
		"balance", contractInfo.Balance,
		"state", contractInfo.State,
	)

	return &contractInfo, nil
}

// SendTransaction 發送交易
func (c *Client) SendTransaction(ctx context.Context, transaction []byte) (string, error) {
	c.logger.Debug("發送交易")

	// 構建請求 URL
	url := fmt.Sprintf("%ssendBoc", c.baseURL)
	
	// 構建請求參數
	params := map[string]interface{}{
		"boc": fmt.Sprintf("%x", transaction),
	}

	// 發送請求
	resp, err := c.makeRequest(ctx, "POST", url, params)
	if err != nil {
		return "", fmt.Errorf("發送交易失敗: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(resp.Result, &result); err != nil {
		return "", fmt.Errorf("解析交易回應失敗: %w", err)
	}

	// 提取交易哈希
	hash, ok := result["hash"].(string)
	if !ok {
		return "", fmt.Errorf("無效的交易哈希格式")
	}

	c.logger.Info("交易發送成功", "hash", hash)
	return hash, nil
}

// GetTransactionStatus 獲取交易狀態
func (c *Client) GetTransactionStatus(ctx context.Context, hash string) (string, error) {
	c.logger.Debug("查詢交易狀態", "hash", hash)

	// 構建請求 URL
	url := fmt.Sprintf("%sgetTransactions", c.baseURL)
	
	// 構建請求參數
	params := map[string]interface{}{
		"hash": hash,
	}

	// 發送請求
	resp, err := c.makeRequest(ctx, "GET", url, params)
	if err != nil {
		return "", fmt.Errorf("查詢交易狀態失敗: %w", err)
	}

	var transactions []map[string]interface{}
	if err := json.Unmarshal(resp.Result, &transactions); err != nil {
		return "", fmt.Errorf("解析交易狀態失敗: %w", err)
	}

	if len(transactions) == 0 {
		return "pending", nil
	}

	// 假設第一個交易就是我們要查的
	tx := transactions[0]
	status := "unknown"
	
	if success, ok := tx["success"].(bool); ok {
		if success {
			status = "success"
		} else {
			status = "failed"
		}
	}

	c.logger.Debug("交易狀態查詢完成", "hash", hash, "status", status)
	return status, nil
}

// RunGetMethod 執行合約的 get 方法
func (c *Client) RunGetMethod(ctx context.Context, contractAddress, method string, params []interface{}) (json.RawMessage, error) {
	c.logger.Debug("執行合約 get 方法", 
		"address", contractAddress,
		"method", method,
		"params", params,
	)

	// 構建請求 URL
	url := fmt.Sprintf("%srunGetMethod", c.baseURL)
	
	// 構建請求參數
	requestParams := map[string]interface{}{
		"address": contractAddress,
		"method":  method,
		"stack":   params,
	}

	// 發送請求
	resp, err := c.makeRequest(ctx, "POST", url, requestParams)
	if err != nil {
		return nil, fmt.Errorf("執行合約方法失敗: %w", err)
	}

	c.logger.Debug("合約方法執行成功", "method", method)
	return resp.Result, nil
}

// makeRequest 發送 HTTP 請求
func (c *Client) makeRequest(ctx context.Context, method, url string, params map[string]interface{}) (*APIResponse, error) {
	var body io.Reader
	
	if method == "POST" {
		jsonData, err := json.Marshal(params)
		if err != nil {
			return nil, fmt.Errorf("編碼請求參數失敗: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return nil, fmt.Errorf("創建請求失敗: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("發送請求失敗: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("讀取回應失敗: %w", err)
	}

	var apiResp APIResponse
	if err := json.Unmarshal(bodyBytes, &apiResp); err != nil {
		return nil, fmt.Errorf("解析 API 回應失敗: %w", err)
	}

	if !apiResp.Ok {
		return nil, fmt.Errorf("API 錯誤: %s", apiResp.Error)
	}

	return &apiResp, nil
}