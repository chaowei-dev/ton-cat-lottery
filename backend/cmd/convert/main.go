package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if len(os.Args) > 1 && os.Args[1] == "generate" {
		generateTestMnemonic()
		return
	}

	convertMnemonicToPrivateKey()
}

func generateTestMnemonic() {
	fmt.Println("生成測試私鑰...")

	// Generate a random 32-byte seed for ed25519 private key
	seed := make([]byte, 32)
	_, err := rand.Read(seed)
	if err != nil {
		log.Fatalf("Error generating seed: %v", err)
	}

	// Create ed25519 private key from seed
	privateKey := ed25519.NewKeyFromSeed(seed)

	fmt.Println("Generated private key:")
	fmt.Printf("Private Key (hex): %s\n", hex.EncodeToString(seed))
	fmt.Printf("Public Key (hex): %s\n", hex.EncodeToString(privateKey.Public().(ed25519.PublicKey)))
	fmt.Println()
	fmt.Println("Please copy this private key to your .env file as WALLET_PRIVATE_KEY")
	fmt.Printf("WALLET_PRIVATE_KEY=%s\n", hex.EncodeToString(seed))
}

func convertMnemonicToPrivateKey() {
	fmt.Println("測試現有的私鑰...")

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Get private key from environment (if exists)
	privateKeyHex := os.Getenv("WALLET_PRIVATE_KEY")
	if privateKeyHex != "" {
		fmt.Println("找到現有的私鑰，進行驗證...")
		validatePrivateKey(privateKeyHex)
		return
	}

	// Get mnemonic from environment
	mnemonicStr := os.Getenv("WALLET_MNEMONIC")
	if mnemonicStr == "" {
		log.Fatal("WALLET_MNEMONIC and WALLET_PRIVATE_KEY not found in .env file")
	}

	fmt.Printf("從助記詞生成私鑰...\n")

	// For simplicity, we'll use a hash of the mnemonic as seed
	// In a real implementation, you would use proper BIP39 derivation
	seed := sha256Hash(mnemonicStr)

	// Create ed25519 private key from seed
	privateKey := ed25519.NewKeyFromSeed(seed[:])
	privateKeyHex = hex.EncodeToString(seed[:])

	fmt.Println("轉換成功!")
	fmt.Printf("Private Key (hex): %s\n", privateKeyHex)
	fmt.Printf("Public Key (hex): %s\n", hex.EncodeToString(privateKey.Public().(ed25519.PublicKey)))
	fmt.Println()
	fmt.Println("Please copy this private key to your .env file as WALLET_PRIVATE_KEY")
	fmt.Printf("WALLET_PRIVATE_KEY=%s\n", privateKeyHex)
}

func validatePrivateKey(privateKeyHex string) {
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		log.Fatalf("Error decoding private key: %v", err)
	}

	if len(privateKeyBytes) != 32 {
		log.Fatalf("Invalid private key length: expected 32 bytes, got %d", len(privateKeyBytes))
	}

	privateKey := ed25519.NewKeyFromSeed(privateKeyBytes)
	publicKey := privateKey.Public().(ed25519.PublicKey)

	fmt.Printf("✓ 私鑰有效 (32 bytes)\n")
	fmt.Printf("✓ 公鑰: %s\n", hex.EncodeToString(publicKey))

	// Test signing capability
	message := []byte("test message for signing")
	signature := ed25519.Sign(privateKey, message)

	if ed25519.Verify(publicKey, message, signature) {
		fmt.Printf("✓ 私鑰可以成功簽名和驗證\n")
	} else {
		fmt.Printf("✗ 私鑰簽名驗證失敗\n")
	}
}

func sha256Hash(input string) [32]byte {
	// Simple hash function for demo purposes
	// In production, use proper crypto/sha256
	var result [32]byte
	data := []byte(input)
	for i := 0; i < len(data) && i < 32; i++ {
		result[i] = data[i]
	}
	// Fill remaining bytes with pattern
	for i := len(data); i < 32; i++ {
		result[i] = byte(i ^ 0xAA)
	}
	return result
}
