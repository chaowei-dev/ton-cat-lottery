package wallet

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"os"
)

// Manager handles wallet operations and private key management
type Manager struct {
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
	address    string // Simplified address for internal use
	tonAddress string // Real TON blockchain address
}

// NewManager creates a new wallet manager from environment variables
func NewManager() (*Manager, error) {
	privateKeyHex := os.Getenv("WALLET_PRIVATE_KEY")
	if privateKeyHex == "" {
		return nil, fmt.Errorf("WALLET_PRIVATE_KEY not found in environment")
	}

	// Decode private key from hex
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("error decoding private key: %w", err)
	}

	if len(privateKeyBytes) != 32 {
		return nil, fmt.Errorf("invalid private key length: expected 32 bytes, got %d", len(privateKeyBytes))
	}

	// Create private key from seed
	privateKey := ed25519.NewKeyFromSeed(privateKeyBytes)
	publicKey := privateKey.Public().(ed25519.PublicKey)

	// Generate address from public key (simplified version)
	address := generateAddressFromPublicKey(publicKey)

	// Get TON address from environment
	tonAddress := os.Getenv("WALLET_TON_ADDRESS")
	if tonAddress == "" {
		tonAddress = "TON_ADDRESS_NOT_SET"
	}

	return &Manager{
		privateKey: privateKey,
		publicKey:  publicKey,
		address:    address,
		tonAddress: tonAddress,
	}, nil
}

// GetPrivateKey returns the private key
func (m *Manager) GetPrivateKey() ed25519.PrivateKey {
	return m.privateKey
}

// GetPublicKey returns the public key
func (m *Manager) GetPublicKey() ed25519.PublicKey {
	return m.publicKey
}

// GetAddress returns the simplified wallet address as string
func (m *Manager) GetAddress() string {
	return m.address
}

// GetTONAddress returns the real TON blockchain address
func (m *Manager) GetTONAddress() string {
	return m.tonAddress
}

// GetPrivateKeyHex returns the private key as hex string
func (m *Manager) GetPrivateKeyHex() string {
	return hex.EncodeToString(m.privateKey.Seed())
}

// GetPublicKeyHex returns the public key as hex string
func (m *Manager) GetPublicKeyHex() string {
	return hex.EncodeToString(m.publicKey)
}

// Sign signs a message with the private key
func (m *Manager) Sign(message []byte) []byte {
	return ed25519.Sign(m.privateKey, message)
}

// Verify verifies a signature with the public key
func (m *Manager) Verify(message, signature []byte) bool {
	return ed25519.Verify(m.publicKey, message, signature)
}

// generateAddressFromPublicKey creates a simplified address from public key
func generateAddressFromPublicKey(publicKey ed25519.PublicKey) string {
	// This is a simplified address generation
	// In a real TON implementation, you would use proper TON address format
	return hex.EncodeToString(publicKey)[:16] + "..." // First 16 chars + ellipsis
}
