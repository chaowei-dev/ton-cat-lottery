// Package main provides the entry point for the TON Cat Lottery Backend service.
// This daemon service monitors TON blockchain lottery contracts and automatically
// triggers lottery draws when conditions are met.
package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"ton-cat-lottery-backend/internal/config"
	"ton-cat-lottery-backend/internal/contract"
	"ton-cat-lottery-backend/internal/logger"
)

// main is the entry point for the TON Cat Lottery Backend daemon.
// It initializes the service, sets up graceful shutdown handling,
// and starts the lottery monitoring loop.
func main() {
	// Initialize default logger
	log := logger.NewDefault()
	log.Info("Starting TON Cat Lottery Backend...")
	
	// Load .env file if it exists (ignore error if file doesn't exist)
	if err := godotenv.Load(); err != nil {
		log.Info("No .env file found, using system environment variables")
	} else {
		log.Info("Loaded configuration from .env file")
	}
	
	// Load and validate configuration from environment variables
	cfg := config.Load()
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Configuration validation failed: %v", err)
	}
	
	// Create TON API client for contract interactions
	client := contract.NewClient(cfg, log)
	
	// Set up context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	// Set up signal handling for graceful shutdown (SIGINT, SIGTERM)
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	
	// Handle shutdown signals in a separate goroutine
	go func() {
		<-sigChan
		log.Info("Received shutdown signal")
		cancel()
	}()
	
	log.Info("Backend service started successfully")
	
	// Create ticker for periodic lottery status polling
	ticker := time.NewTicker(cfg.PollingInterval)
	defer ticker.Stop()
	
	// Main service loop - monitors lottery status and triggers draws
	for {
		select {
		case <-ctx.Done():
			// Graceful shutdown triggered
			log.Info("Shutting down backend service")
			return
		case <-ticker.C:
			// Periodic lottery status check
			if err := checkLotteryStatus(ctx, client, log); err != nil {
				log.Errorf("Failed to check lottery status: %v", err)
			}
		}
	}
}

// checkLotteryStatus queries the current lottery contract state and logs the status.
// In the future, this function will also contain the logic to automatically
// trigger lottery draws when conditions are met (lottery full, not in progress).
//
// Parameters:
//   - ctx: Context for request cancellation
//   - client: TON API client for contract interactions
//   - log: Logger instance for status reporting
//
// Returns:
//   - error: Any error encountered during status check
func checkLotteryStatus(ctx context.Context, client *contract.Client, log *logger.Logger) error {
	// Fetch current contract state from TON blockchain
	contractInfo, err := client.GetContractInfo(ctx)
	if err != nil {
		return err
	}
	
	// Log current lottery status for monitoring
	log.Infof("Current lottery status: Round=%d, Active=%t, InProgress=%t, Participants=%d/%d",
		contractInfo.CurrentRound,
		contractInfo.LotteryActive,
		contractInfo.DrawInProgress,
		contractInfo.ParticipantCount,
		contractInfo.MaxParticipants)
	
	// TODO: Add automatic lottery draw triggering logic here
	// When lotteryActive == false && drawInProgress == false && round not processed
	// Send drawWinner transaction to the contract
	
	return nil
}