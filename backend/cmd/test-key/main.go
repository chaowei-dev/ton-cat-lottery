package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// TON API 響應結構體
type TONAccountResponse struct {
	Ok     bool `json:"ok"`
	Result struct {
		Balance string `json:"balance"`
		State   string `json:"state"`
	} `json:"result"`
}

type TONAPIError struct {
	Ok          bool   `json:"ok"`
	Error       string `json:"error"`
	Code        int    `json:"code"`
	Description string `json:"description,omitempty"`
}


func main() {
	// 載入 .env 檔案
	err := godotenv.Load("../../.env")
	if err != nil {
		// 嘗試當前目錄的 .env
		err = godotenv.Load()
		if err != nil {
			log.Printf("Error loading .env file: %v", err)
			fmt.Println("Please make sure .env file exists and contains WALLET_PRIVATE_KEY")
			os.Exit(1)
		}
	}

	// 從環境變數獲取私鑰
	privateKeyHex := os.Getenv("WALLET_PRIVATE_KEY")
	if privateKeyHex == "" {
		fmt.Println("錯誤：未找到 WALLET_PRIVATE_KEY 環境變數")
		fmt.Println("請在 .env 檔案中添加：")
		fmt.Println("WALLET_PRIVATE_KEY=your_private_key_here")
		os.Exit(1)
	}

	fmt.Println("🔍 測試私鑰...")
	fmt.Printf("私鑰 (hex): %s\n", privateKeyHex)
	fmt.Println()

	// 解析私鑰
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		fmt.Printf("❌ 錯誤：無法解析私鑰 - %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ 私鑰格式正確\n")
	fmt.Printf("私鑰長度: %d 字節\n", len(privateKeyBytes))
	fmt.Println()

	// 驗證私鑰長度
	var privateKey ed25519.PrivateKey
	var publicKey ed25519.PublicKey

	if len(privateKeyBytes) == 64 {
		// 64字節 = 32字節種子 + 32字節公鑰
		privateKey = ed25519.PrivateKey(privateKeyBytes)
		publicKey = privateKey.Public().(ed25519.PublicKey)
		fmt.Println("🔑 檢測到 Ed25519 完整私鑰 (64字節)")
	} else if len(privateKeyBytes) == 32 {
		// 32字節種子
		privateKey = ed25519.NewKeyFromSeed(privateKeyBytes)
		publicKey = privateKey.Public().(ed25519.PublicKey)
		fmt.Println("🌱 檢測到 Ed25519 種子 (32字節)")
	} else {
		fmt.Printf("❌ 錯誤：私鑰長度不正確 - 期望32或64字節，得到%d字節\n", len(privateKeyBytes))
		os.Exit(1)
	}

	fmt.Printf("🔓 公鑰: %x\n", publicKey)
	fmt.Println()

	// 生成 TON 錢包地址
	// 這是簡化版本，實際 TON 地址生成更複雜
	addressHash := sha256.Sum256(publicKey)
	tonAddress := fmt.Sprintf("EQ%x", addressHash[:30]) // 簡化的地址格式

	fmt.Println("📍 錢包信息:")
	fmt.Printf("TON 地址 (簡化): %s\n", tonAddress)
	fmt.Println()

	// 測試簽名功能
	testMessage := "Hello TON Cat Lottery!"
	signature := ed25519.Sign(privateKey, []byte(testMessage))
	
	fmt.Println("✏️  簽名測試:")
	fmt.Printf("測試訊息: %s\n", testMessage)
	fmt.Printf("簽名: %x\n", signature)
	
	// 驗證簽名
	isValid := ed25519.Verify(publicKey, []byte(testMessage), signature)
	if isValid {
		fmt.Println("✅ 簽名驗證成功！")
	} else {
		fmt.Println("❌ 簽名驗證失敗！")
	}
	
	fmt.Println()
	fmt.Println("🎉 私鑰測試完成！")
	fmt.Println("你的私鑰是有效的 Ed25519 密鑰，可以用於 TON 區塊鏈交易。")
}