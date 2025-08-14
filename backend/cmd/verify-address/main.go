package main

import (
	"crypto/ed25519"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("驗證助記詞對應的 TON 地址...")

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	mnemonicStr := os.Getenv("WALLET_MNEMONIC")
	if mnemonicStr == "" {
		log.Fatal("WALLET_MNEMONIC not found in .env file")
	}

	expectedAddress := "0QC0482t814YivoEaIea43khv6jo4Mp_sXtx0eOIgtzUsrs4"

	fmt.Printf("助記詞: %s\n", mnemonicStr)
	fmt.Printf("期望的 TON 地址: %s\n", expectedAddress)

	// 目前我們使用簡化的方法來驗證助記詞
	// 為了生成正確的 TON 地址，我們需要實現 BIP39 + TON 錢包邏輯

	fmt.Println("\n注意：目前的實現是簡化版本")
	fmt.Println("要生成正確的 TON 地址，需要：")
	fmt.Println("1. 正確的 BIP39 助記詞到種子轉換")
	fmt.Println("2. TON 錢包合約地址生成")
	fmt.Println("3. 使用正確的 Workchain 和錢包版本 (如 V5R1)")

	// 簡化的助記詞驗證
	words := strings.Fields(mnemonicStr)
	if len(words) != 24 {
		log.Fatalf("Invalid mnemonic: expected 24 words, got %d", len(words))
	}

	fmt.Printf("\n✓ 助記詞格式正確 (%d 個單詞)\n", len(words))

	// 使用簡化的哈希方法生成私鑰（僅用於演示）
	seed := sha256Hash(mnemonicStr)
	privateKey := ed25519.NewKeyFromSeed(seed[:])
	publicKey := privateKey.Public().(ed25519.PublicKey)

	fmt.Printf("✓ 生成的公鑰: %x\n", publicKey)

	fmt.Println("\n要獲得正確的 TON 地址，建議：")
	fmt.Println("1. 使用官方 TON SDK")
	fmt.Println("2. 或者使用 TON CLI 工具驗證")
	fmt.Println("3. 或者使用 TON 錢包應用程序導入助記詞")
}

func sha256Hash(input string) [32]byte {
	// Simple hash function for demo purposes
	var result [32]byte
	data := []byte(input)
	for i := 0; i < len(data) && i < 32; i++ {
		result[i] = data[i]
	}
	for i := len(data); i < 32; i++ {
		result[i] = byte(i ^ 0xAA)
	}
	return result
}
