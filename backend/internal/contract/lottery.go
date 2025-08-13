package contract

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	
	"ton-cat-lottery-backend/pkg/types"
)

type TONAPIResponse struct {
	OK     bool `json:"ok"`
	Result struct {
		Stack [][]interface{} `json:"stack"`
	} `json:"result"`
	Error string `json:"error,omitempty"`
}

type TONCenterRequest struct {
	Address string        `json:"address"`
	Method  string        `json:"method"`
	Stack   []interface{} `json:"stack"`
}

func (c *Client) GetContractInfo(ctx context.Context) (*types.ContractInfo, error) {
	var contractInfo *types.ContractInfo
	var err error
	
	err = c.retryWithBackoff(ctx, func() error {
		info, apiErr := c.getContractInfoOnce(ctx)
		if apiErr != nil {
			return apiErr
		}
		contractInfo = info
		return nil
	})
	
	if err != nil {
		return nil, fmt.Errorf("failed to get contract info after retries: %w", err)
	}
	
	return contractInfo, nil
}

func (c *Client) getContractInfoOnce(ctx context.Context) (*types.ContractInfo, error) {
	url := "https://testnet.toncenter.com/api/v2/runGetMethod"
	if !c.config.IsTestnet {
		url = "https://toncenter.com/api/v2/runGetMethod"
	}
	
	requestBody := TONCenterRequest{
		Address: c.config.LotteryContractAddress,
		Method:  "getContractInfo",
		Stack:   []interface{}{},
	}
	
	c.logger.Debugf("Fetching contract info from: %s", url)
	
	respBody, err := c.makeRequest(ctx, "POST", url, requestBody)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	
	var apiResp TONAPIResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse API response: %w", err)
	}
	
	if !apiResp.OK {
		return nil, fmt.Errorf("API returned error: %s", apiResp.Error)
	}
	
	contractInfo, err := c.parseContractInfoStack(apiResp.Result.Stack)
	if err != nil {
		return nil, fmt.Errorf("failed to parse contract info: %w", err)
	}
	
	c.logger.Debugf("Contract info retrieved: currentRound=%d, lotteryActive=%t, drawInProgress=%t", 
		contractInfo.CurrentRound, contractInfo.LotteryActive, contractInfo.DrawInProgress)
	
	return contractInfo, nil
}

func (c *Client) parseContractInfoStack(stack [][]interface{}) (*types.ContractInfo, error) {
	if len(stack) < 5 {
		return nil, fmt.Errorf("invalid stack response, expected at least 5 elements, got %d", len(stack))
	}
	
	contractInfo := &types.ContractInfo{}
	
	currentRound, err := c.parseStackInt(stack[0])
	if err != nil {
		return nil, fmt.Errorf("failed to parse currentRound: %w", err)
	}
	contractInfo.CurrentRound = currentRound
	
	lotteryActive, err := c.parseStackBool(stack[1])
	if err != nil {
		return nil, fmt.Errorf("failed to parse lotteryActive: %w", err)
	}
	contractInfo.LotteryActive = lotteryActive
	
	drawInProgress, err := c.parseStackBool(stack[2])
	if err != nil {
		return nil, fmt.Errorf("failed to parse drawInProgress: %w", err)
	}
	contractInfo.DrawInProgress = drawInProgress
	
	participantCount, err := c.parseStackInt(stack[3])
	if err != nil {
		return nil, fmt.Errorf("failed to parse participantCount: %w", err)
	}
	contractInfo.ParticipantCount = participantCount
	
	maxParticipants, err := c.parseStackInt(stack[4])
	if err != nil {
		return nil, fmt.Errorf("failed to parse maxParticipants: %w", err)
	}
	contractInfo.MaxParticipants = maxParticipants
	
	return contractInfo, nil
}

func (c *Client) parseStackInt(stackItem []interface{}) (int, error) {
	if len(stackItem) < 2 {
		return 0, fmt.Errorf("invalid stack item format")
	}
	
	itemType, ok := stackItem[0].(string)
	if !ok {
		return 0, fmt.Errorf("invalid stack item type format")
	}
	
	if itemType != "num" {
		return 0, fmt.Errorf("expected num type, got %s", itemType)
	}
	
	value, ok := stackItem[1].(string)
	if !ok {
		return 0, fmt.Errorf("invalid stack item value format")
	}
	
	if strings.HasPrefix(value, "0x") {
		intVal, err := strconv.ParseInt(value[2:], 16, 64)
		if err != nil {
			return 0, fmt.Errorf("failed to parse hex value %s: %w", value, err)
		}
		return int(intVal), nil
	}
	
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("failed to parse int value %s: %w", value, err)
	}
	
	return intVal, nil
}

func (c *Client) parseStackBool(stackItem []interface{}) (bool, error) {
	if len(stackItem) < 2 {
		return false, fmt.Errorf("invalid stack item format")
	}
	
	itemType, ok := stackItem[0].(string)
	if !ok {
		return false, fmt.Errorf("invalid stack item type format")
	}
	
	if itemType != "num" {
		return false, fmt.Errorf("expected num type, got %s", itemType)
	}
	
	value, ok := stackItem[1].(string)
	if !ok {
		return false, fmt.Errorf("invalid stack item value format")
	}
	
	intVal, err := strconv.Atoi(value)
	if err != nil {
		return false, fmt.Errorf("failed to parse bool value %s: %w", value, err)
	}
	
	return intVal != 0, nil
}