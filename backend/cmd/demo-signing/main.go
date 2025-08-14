package main

import (
	"encoding/hex"
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"ton-cat-lottery-backend/internal/wallet"
)

func main() {
	fmt.Println("演示私鑰簽名交易能力...")

	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Create wallet manager
	manager, err := wallet.NewManager()
	if err != nil {
		log.Fatalf("Error creating wallet manager: %v", err)
	}

	fmt.Printf("錢包信息:\n")
	fmt.Printf("  TON 地址: %s\n", manager.GetTONAddress())
	fmt.Printf("  公鑰: %s\n", manager.GetPublicKeyHex())
	fmt.Printf("  私鑰: %s\n", manager.GetPrivateKeyHex())

	// 模擬不同類型的交易數據
	transactions := []struct {
		name string
		data []byte
	}{
		{"轉賬交易", []byte("transfer:100:TON:to:EQBMegbDGejjYeIutXneUvYvWfJMpS71b11kJLaNKFnP_6Jh")},
		{"智能合約調用", []byte("contract_call:lottery:join:amount:50")},
		{"NFT 鑄造", []byte("mint_nft:cat:rarity:rare:owner:0QC0482t814YivoEaIea43khv6jo4Mp_sXtx0eOIgtzUsrs4")},
		{"消息簽名", []byte("Hello TON Blockchain! This is a signed message.")},
	}

	fmt.Printf("\n=== 交易簽名演示 ===\n")
	for i, tx := range transactions {
		fmt.Printf("\n%d. %s\n", i+1, tx.name)
		fmt.Printf("   原始數據: %s\n", string(tx.data))
		
		// 簽名
		signature := manager.Sign(tx.data)
		fmt.Printf("   簽名 (hex): %s\n", hex.EncodeToString(signature))
		
		// 驗證
		if manager.Verify(tx.data, signature) {
			fmt.Printf("   ✓ 簽名驗證成功\n")
		} else {
			fmt.Printf("   ✗ 簽名驗證失敗\n")
		}
		
		// 展示簽名格式
		fmt.Printf("   簽名長度: %d bytes (ed25519 標準)\n", len(signature))
	}

	fmt.Printf("\n=== 總結 ===\n")
	fmt.Printf("✓ 私鑰可以對任何數據進行 ed25519 簽名\n")
	fmt.Printf("✓ 簽名可以被驗證\n")
	fmt.Printf("✓ 適用於一般的數位簽名需求\n")
	fmt.Printf("\n⚠️  要用於真正的 TON 交易，還需要:\n")
	fmt.Printf("   1. TON 交易格式 (Cell/BOC)\n")
	fmt.Printf("   2. TON 錢包合約邏輯\n")
	fmt.Printf("   3. TON 網絡連接和廣播\n")
	fmt.Printf("   4. 正確的序列號 (seqno) 管理\n")
}