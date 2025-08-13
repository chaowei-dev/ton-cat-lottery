package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/tyler-smith/go-bip39"
	"golang.org/x/crypto/pbkdf2"
)

func generateTestMnemonic() {
	fmt.Println("🎲 生成測試用助記詞...")
	
	// 生成 256 位熵（24個單詞）
	entropy, err := bip39.NewEntropy(256)
	if err != nil {
		log.Fatal("生成熵失敗:", err)
	}

	// 生成助記詞
	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		log.Fatal("生成助記詞失敗:", err)
	}

	fmt.Printf("✨ 測試助記詞（24個單詞）:\n%s\n\n", mnemonic)
	fmt.Println("請將此助記詞複製到 .env 文件的 WALLET_MNEMONIC 中")
	fmt.Println("然后運行: go run cmd/convert/main.go")
}

func main() {
	// 檢查是否要生成助記詞
	if len(os.Args) > 1 && os.Args[1] == "generate" {
		generateTestMnemonic()
		return
	}

	// 載入 .env 檔案
	err := godotenv.Load("../../.env")
	if err != nil {
		// 嘗試當前目錄的 .env
		err = godotenv.Load()
		if err != nil {
			log.Printf("Error loading .env file: %v", err)
			fmt.Println("Please make sure .env file exists and contains WALLET_MNEMONIC")
			os.Exit(1)
		}
	}

	// 從環境變數獲取助記詞
	mnemonic := os.Getenv("WALLET_MNEMONIC")
	if mnemonic == "" {
		fmt.Println("錯誤：未找到 WALLET_MNEMONIC 環境變數")
		fmt.Println("請在 .env 檔案中添加：")
		fmt.Println("WALLET_MNEMONIC=word1 word2 word3 ... word24")
		os.Exit(1)
	}

	// 驗證助記詞
	mnemonic = strings.TrimSpace(mnemonic)
	words := strings.Fields(mnemonic)
	
	if len(words) != 24 {
		fmt.Printf("錯誤：助記詞應該包含 24 個單詞，但找到 %d 個\n", len(words))
		os.Exit(1)
	}

	
	// 驗證助記詞是否有效
	isValidBip39 := bip39.IsMnemonicValid(mnemonic)
	if !isValidBip39 {
		fmt.Println("⚠️  警告：助記詞不符合標準 BIP39 格式")
		fmt.Println("可能的原因：")
		fmt.Println("1. 校驗和不正確") 
		fmt.Println("2. 單詞順序錯誤")
		fmt.Println("3. 來源不是標準 BIP39 錢包")
		fmt.Println()
		fmt.Println("繼續使用此助記詞生成私鑰...")
		fmt.Println("注意：生成的私鑰可能與其他錢包不兼容")
		fmt.Println()
	} else {
		fmt.Println("✅ 助記詞驗證成功（標準 BIP39 格式）")
	}

	fmt.Printf("📝 處理助記詞：%s\n", mnemonic)
	fmt.Println()

	// 生成種子
	var seed []byte
	if isValidBip39 {
		seed = bip39.NewSeed(mnemonic, "")
		fmt.Printf("🌱 BIP39 種子 (前32字節): %x\n", seed[:32])
	} else {
		// 對於非標準助記詞，使用 PBKDF2 直接生成種子
		seed = pbkdf2.Key([]byte(mnemonic), []byte("mnemonic"), 2048, 64, sha256.New)
		fmt.Printf("🌱 自定義種子 (前32字節): %x\n", seed[:32])
	}
	fmt.Println()

	// 為 TON 生成私鑰
	// TON 使用 Ed25519 簽名算法
	// 我們使用 PBKDF2 來從助記詞派生私鑰
	tonPrivateKey := pbkdf2.Key([]byte(mnemonic), []byte("TON default seed"), 100000, 32, sha256.New)
	
	fmt.Printf("🔑 TON 私鑰 (32字節): %x\n", tonPrivateKey)
	fmt.Println()

	// 生成 Ed25519 密鑰對用於 TON
	privateKey := ed25519.NewKeyFromSeed(tonPrivateKey)
	publicKey := privateKey.Public().(ed25519.PublicKey)

	fmt.Printf("🔐 Ed25519 私鑰 (64字節): %x\n", privateKey)
	fmt.Printf("🔓 Ed25519 公鑰 (32字節): %x\n", publicKey)
	fmt.Println()

	// 建議的 .env 更新
	fmt.Println("📝 建議的 .env 檔案更新：")
	fmt.Println("# 使用以下私鑰替換現有的 WALLET_PRIVATE_KEY")
	fmt.Printf("WALLET_PRIVATE_KEY=%x\n", privateKey)
	fmt.Println()
	
	fmt.Println("✨ 轉換完成！")
	fmt.Println("請將上述私鑰複製到你的 .env 檔案中。")
}