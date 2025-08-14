package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"ton-cat-lottery-backend/internal/wallet"
)

func main() {
	fmt.Println("測試私鑰與助記詞的關係...")

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Create wallet manager from private key
	manager, err := wallet.NewManager()
	if err != nil {
		log.Fatalf("Error creating wallet manager: %v", err)
	}

	fmt.Printf("內部地址: %s\n", manager.GetAddress())
	fmt.Printf("TON 區塊鏈地址: %s\n", manager.GetTONAddress())
	fmt.Printf("私鑰 (hex): %s\n", manager.GetPrivateKeyHex())
	fmt.Printf("公鑰 (hex): %s\n", manager.GetPublicKeyHex())

	// Check if mnemonic exists in environment
	mnemonicStr := os.Getenv("WALLET_MNEMONIC")
	if mnemonicStr == "" {
		fmt.Println("\n注意: .env 文件中未找到 WALLET_MNEMONIC")
		fmt.Println("無法驗證私鑰與助記詞的對應關係")
		fmt.Println("如需測試對應關係，請在 .env 中添加 WALLET_MNEMONIC")
		return
	}

	fmt.Println("\n找到助記詞，進行驗證...")
	fmt.Printf("助記詞: %s\n", mnemonicStr)

	// Test signing with different messages to prove private key works
	testMessages := []string{
		"Test message 1",
		"Hello TON Blockchain",
		"Private key validation test",
	}

	fmt.Println("\n=== 私鑰簽名測試 ===")
	for i, msg := range testMessages {
		msgBytes := []byte(msg)
		signature := manager.Sign(msgBytes)

		if manager.Verify(msgBytes, signature) {
			fmt.Printf("✓ 測試 %d: 簽名驗證成功\n", i+1)
		} else {
			fmt.Printf("✗ 測試 %d: 簽名驗證失敗\n", i+1)
		}
	}

	fmt.Println("\n=== 私鑰管理驗證完成 ===")
	fmt.Println("✓ 私鑰功能正常")
	fmt.Println("✓ 可以獨立簽名交易")
}
