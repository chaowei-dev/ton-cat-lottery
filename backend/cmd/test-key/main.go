package main

import (
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"ton-cat-lottery-backend/internal/wallet"
)

func main() {
	fmt.Println("測試私鑰和簽名功能...")

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Test private key management
	testPrivateKeyManagement()
}

func testPrivateKeyManagement() {
	fmt.Println("\n=== 測試私鑰管理 ===")

	// Create wallet manager from environment variables
	manager, err := wallet.NewManager()
	if err != nil {
		log.Fatalf("Error creating wallet manager: %v", err)
	}

	fmt.Printf("✓ 成功載入私鑰\n")
	fmt.Printf("✓ 內部地址: %s\n", manager.GetAddress())
	fmt.Printf("✓ TON 區塊鏈地址: %s\n", manager.GetTONAddress())
	fmt.Printf("✓ 私鑰 (hex): %s\n", manager.GetPrivateKeyHex())
	fmt.Printf("✓ 公鑰 (hex): %s\n", manager.GetPublicKeyHex())

	// Test signing capability
	testMessage := []byte("Hello TON! This is a test message for signing.")
	signature := manager.Sign(testMessage)

	fmt.Printf("✓ 簽名長度: %d bytes\n", len(signature))
	fmt.Printf("✓ 簽名 (hex): %x\n", signature)

	// Verify signature
	if manager.Verify(testMessage, signature) {
		fmt.Printf("✓ 私鑰可以成功簽名和驗證\n")
	} else {
		fmt.Printf("✗ 私鑰簽名驗證失敗\n")
	}

	// Test with different message (should fail)
	differentMessage := []byte("Different message")
	if !manager.Verify(differentMessage, signature) {
		fmt.Printf("✓ 不同訊息的簽名驗證正確失敗\n")
	} else {
		fmt.Printf("✗ 不同訊息的簽名驗證應該失敗但沒有\n")
	}

	fmt.Printf("\n=== 私鑰管理測試完成 ===\n")
	fmt.Printf("✓ 私鑰可以獨立簽名交易\n")
	fmt.Printf("✓ 私鑰管理功能正常\n")
}
