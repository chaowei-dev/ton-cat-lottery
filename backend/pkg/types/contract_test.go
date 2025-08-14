package types

import (
	"encoding/json"
	"testing"
)

func TestContractInfo(t *testing.T) {
	// Test basic struct creation
	info := ContractInfo{
		CurrentRound:     5,
		LotteryActive:    true,
		DrawInProgress:   false,
		ParticipantCount: 2,
		MaxParticipants:  3,
	}

	if info.CurrentRound != 5 {
		t.Errorf("Expected CurrentRound 5, got %d", info.CurrentRound)
	}

	if !info.LotteryActive {
		t.Errorf("Expected LotteryActive true, got %t", info.LotteryActive)
	}

	if info.DrawInProgress {
		t.Errorf("Expected DrawInProgress false, got %t", info.DrawInProgress)
	}

	if info.ParticipantCount != 2 {
		t.Errorf("Expected ParticipantCount 2, got %d", info.ParticipantCount)
	}

	if info.MaxParticipants != 3 {
		t.Errorf("Expected MaxParticipants 3, got %d", info.MaxParticipants)
	}
}

func TestContractInfoJSON(t *testing.T) {
	info := ContractInfo{
		CurrentRound:     10,
		LotteryActive:    false,
		DrawInProgress:   true,
		ParticipantCount: 3,
		MaxParticipants:  3,
	}

	// Test JSON marshaling
	data, err := json.Marshal(info)
	if err != nil {
		t.Fatalf("Failed to marshal ContractInfo: %v", err)
	}

	// Test JSON unmarshaling
	var decoded ContractInfo
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal ContractInfo: %v", err)
	}

	// Verify all fields are preserved
	if decoded.CurrentRound != info.CurrentRound {
		t.Errorf("Expected CurrentRound %d, got %d", info.CurrentRound, decoded.CurrentRound)
	}

	if decoded.LotteryActive != info.LotteryActive {
		t.Errorf("Expected LotteryActive %t, got %t", info.LotteryActive, decoded.LotteryActive)
	}

	if decoded.DrawInProgress != info.DrawInProgress {
		t.Errorf("Expected DrawInProgress %t, got %t", info.DrawInProgress, decoded.DrawInProgress)
	}

	if decoded.ParticipantCount != info.ParticipantCount {
		t.Errorf("Expected ParticipantCount %d, got %d", info.ParticipantCount, decoded.ParticipantCount)
	}

	if decoded.MaxParticipants != info.MaxParticipants {
		t.Errorf("Expected MaxParticipants %d, got %d", info.MaxParticipants, decoded.MaxParticipants)
	}
}

func TestContractResponse(t *testing.T) {
	// Test successful response
	info := ContractInfo{
		CurrentRound:     7,
		LotteryActive:    true,
		DrawInProgress:   false,
		ParticipantCount: 1,
		MaxParticipants:  3,
	}

	response := ContractResponse{
		Success: true,
		Data:    info,
	}

	if !response.Success {
		t.Errorf("Expected Success true, got %t", response.Success)
	}

	if response.Data.CurrentRound != 7 {
		t.Errorf("Expected Data.CurrentRound 7, got %d", response.Data.CurrentRound)
	}

	if response.Error != "" {
		t.Errorf("Expected no error, got '%s'", response.Error)
	}

	// Test error response
	errorResponse := ContractResponse{
		Success: false,
		Error:   "API request failed",
	}

	if errorResponse.Success {
		t.Errorf("Expected Success false, got %t", errorResponse.Success)
	}

	if errorResponse.Error != "API request failed" {
		t.Errorf("Expected Error 'API request failed', got '%s'", errorResponse.Error)
	}
}

func TestContractResponseJSON(t *testing.T) {
	info := ContractInfo{
		CurrentRound:     3,
		LotteryActive:    false,
		DrawInProgress:   true,
		ParticipantCount: 3,
		MaxParticipants:  3,
	}

	response := ContractResponse{
		Success: true,
		Data:    info,
	}

	// Test JSON marshaling
	data, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("Failed to marshal ContractResponse: %v", err)
	}

	// Test JSON unmarshaling
	var decoded ContractResponse
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal ContractResponse: %v", err)
	}

	// Verify response fields
	if decoded.Success != response.Success {
		t.Errorf("Expected Success %t, got %t", response.Success, decoded.Success)
	}

	if decoded.Error != response.Error {
		t.Errorf("Expected Error '%s', got '%s'", response.Error, decoded.Error)
	}

	// Verify nested ContractInfo
	if decoded.Data.CurrentRound != info.CurrentRound {
		t.Errorf("Expected Data.CurrentRound %d, got %d", info.CurrentRound, decoded.Data.CurrentRound)
	}

	if decoded.Data.LotteryActive != info.LotteryActive {
		t.Errorf("Expected Data.LotteryActive %t, got %t", info.LotteryActive, decoded.Data.LotteryActive)
	}
}

func TestContractResponseJSONWithError(t *testing.T) {
	response := ContractResponse{
		Success: false,
		Error:   "Contract not found",
	}

	// Test JSON marshaling
	data, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("Failed to marshal error ContractResponse: %v", err)
	}

	// Test JSON unmarshaling
	var decoded ContractResponse
	err = json.Unmarshal(data, &decoded)
	if err != nil {
		t.Fatalf("Failed to unmarshal error ContractResponse: %v", err)
	}

	// Verify error response
	if decoded.Success {
		t.Errorf("Expected Success false, got %t", decoded.Success)
	}

	if decoded.Error != "Contract not found" {
		t.Errorf("Expected Error 'Contract not found', got '%s'", decoded.Error)
	}

	// Verify Data is zero value when there's an error
	if decoded.Data.CurrentRound != 0 {
		t.Errorf("Expected Data.CurrentRound 0 for error response, got %d", decoded.Data.CurrentRound)
	}
}

func TestJSONFieldTags(t *testing.T) {
	// Test that JSON tags are correctly applied
	jsonStr := `{
		"currentRound": 15,
		"lotteryActive": true,
		"drawInProgress": false,
		"participantCount": 5,
		"maxParticipants": 10
	}`

	var info ContractInfo
	err := json.Unmarshal([]byte(jsonStr), &info)
	if err != nil {
		t.Fatalf("Failed to unmarshal JSON with camelCase fields: %v", err)
	}

	if info.CurrentRound != 15 {
		t.Errorf("Expected CurrentRound 15, got %d", info.CurrentRound)
	}

	if !info.LotteryActive {
		t.Errorf("Expected LotteryActive true, got %t", info.LotteryActive)
	}

	if info.ParticipantCount != 5 {
		t.Errorf("Expected ParticipantCount 5, got %d", info.ParticipantCount)
	}

	// Test marshaling produces camelCase
	data, err := json.Marshal(info)
	if err != nil {
		t.Fatalf("Failed to marshal ContractInfo: %v", err)
	}

	jsonStr2 := string(data)
	if !contains(jsonStr2, "currentRound") {
		t.Error("Expected marshaled JSON to contain 'currentRound'")
	}

	if !contains(jsonStr2, "lotteryActive") {
		t.Error("Expected marshaled JSON to contain 'lotteryActive'")
	}

	if !contains(jsonStr2, "drawInProgress") {
		t.Error("Expected marshaled JSON to contain 'drawInProgress'")
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || containsSubstring(s, substr)))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
