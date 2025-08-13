package types

type ContractInfo struct {
	CurrentRound     int  `json:"currentRound"`
	LotteryActive    bool `json:"lotteryActive"`
	DrawInProgress   bool `json:"drawInProgress"`
	ParticipantCount int  `json:"participantCount"`
	MaxParticipants  int  `json:"maxParticipants"`
}

type ContractResponse struct {
	Success bool         `json:"success"`
	Data    ContractInfo `json:"data"`
	Error   string       `json:"error,omitempty"`
}