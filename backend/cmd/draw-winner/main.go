package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"ton-cat-lottery-backend/internal/tonapi"
)

func main() {
	fmt.Println("🎰 TON Cat Lottery - DrawWinner 工具")
	fmt.Println("=" + strings.Repeat("=", 48))

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// Create TON API client
	client, err := tonapi.NewTONClient()
	if err != nil {
		log.Fatalf("Error creating TON client: %v", err)
	}

	// Get contract address from environment
	contractAddr := os.Getenv("LOTTERY_CONTRACT_ADDRESS")
	if contractAddr == "" {
		log.Fatal("LOTTERY_CONTRACT_ADDRESS not found in .env file")
	}

	// Show wallet information
	fmt.Printf("\n💼 錢包資訊:\n")
	walletInfo := client.GetWalletInfo()
	fmt.Printf("   地址: %s\n", walletInfo["address"])
	fmt.Printf("   公鑰: %s\n", walletInfo["publicKey"])
	fmt.Printf("   私鑰: %s\n", walletInfo["privateKey"])

	// Check balance
	fmt.Printf("\n💰 查詢錢包餘額...\n")
	balance, err := client.GetBalance(ctx)
	if err != nil {
		log.Printf("⚠️ 無法查詢餘額: %v", err)
		fmt.Printf("   (這可能是因為錢包地址格式或網路問題)\n")
	} else {
		fmt.Printf("   當前餘額: %s TON\n", tonapi.FormatTON(balance))
	}

	// Check contract information
	fmt.Printf("\n🎲 查詢合約資訊...\n")
	fmt.Printf("   合約地址: %s\n", contractAddr)
	
	contractInfo, err := client.GetContractInfo(ctx, contractAddr)
	if err != nil {
		log.Printf("⚠️ 無法查詢合約資訊: %v", err)
	} else {
		fmt.Printf("   合約狀態: 已找到\n")
		fmt.Printf("   合約詳細資訊: %+v\n", contractInfo)
	}

	// Test private key signing capability
	fmt.Printf("\n🔐 測試私鑰簽名功能...\n")
	err = client.TestSigning()
	if err != nil {
		log.Printf("❌ 簽名測試失敗: %v", err)
	}

	// Check command line arguments
	if len(os.Args) > 1 && os.Args[1] == "draw" {
		fmt.Printf("\n🎯 執行 DrawWinner...\n")
		err = client.SendDrawWinner(ctx, contractAddr)
		if err != nil {
			log.Fatalf("❌ DrawWinner 執行失敗: %v", err)
		}
	} else {
		fmt.Printf("\n💡 使用方法:\n")
		fmt.Printf("   go run cmd/draw-winner/main.go        # 查詢狀態和測試功能\n")
		fmt.Printf("   go run cmd/draw-winner/main.go draw   # 嘗試執行 drawWinner\n")
		fmt.Printf("\n🔍 當前功能:\n")
		fmt.Printf("   ✅ 私鑰管理和簽名\n")
		fmt.Printf("   ✅ 餘額查詢 (透過 TON API)\n")
		fmt.Printf("   ✅ 合約狀態查詢\n")
		fmt.Printf("   ⚠️ 交易發送 (需要進一步開發)\n")
		fmt.Printf("\n📋 接下來的步驟:\n")
		fmt.Printf("   1. 完成 TON 交易構建和簽名\n")
		fmt.Printf("   2. 實現交易廣播到 TON 網路\n")
		fmt.Printf("   3. 或者繼續使用 TypeScript + TonKeeper 進行交易\n")
	}

	fmt.Printf("\n✅ 完成!\n")
}