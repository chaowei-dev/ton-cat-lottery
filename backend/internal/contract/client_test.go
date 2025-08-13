package contract

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
	
	"ton-cat-lottery-backend/internal/config"
	"ton-cat-lottery-backend/internal/logger"
)

func TestNewClient(t *testing.T) {
	cfg := &config.Config{
		APITimeout:   10 * time.Second,
		APIRateLimit: 20,
	}
	log := logger.NewDefault()
	
	client := NewClient(cfg, log)
	
	if client == nil {
		t.Fatal("Expected client to be created")
	}
	
	if client.config != cfg {
		t.Error("Expected client config to match provided config")
	}
	
	if client.logger != log {
		t.Error("Expected client logger to match provided logger")
	}
	
	if client.httpClient == nil {
		t.Error("Expected HTTP client to be initialized")
	}
	
	if client.rateLimiter == nil {
		t.Error("Expected rate limiter to be initialized")
	}
}

func TestRateLimiter(t *testing.T) {
	rl := NewRateLimiter(2, time.Second)
	
	// First two requests should be allowed
	if !rl.Allow() {
		t.Error("Expected first request to be allowed")
	}
	
	if !rl.Allow() {
		t.Error("Expected second request to be allowed")
	}
	
	// Third request should be blocked
	if rl.Allow() {
		t.Error("Expected third request to be blocked")
	}
	
	// Wait and try again
	time.Sleep(1100 * time.Millisecond) // Wait longer than the interval
	
	if !rl.Allow() {
		t.Error("Expected request to be allowed after waiting")
	}
}

func TestRateLimiterConcurrency(t *testing.T) {
	rl := NewRateLimiter(5, time.Second)
	
	// Test concurrent access
	results := make(chan bool, 10)
	
	for i := 0; i < 10; i++ {
		go func() {
			results <- rl.Allow()
		}()
	}
	
	allowed := 0
	blocked := 0
	
	for i := 0; i < 10; i++ {
		if <-results {
			allowed++
		} else {
			blocked++
		}
	}
	
	if allowed != 5 {
		t.Errorf("Expected 5 requests allowed, got %d", allowed)
	}
	
	if blocked != 5 {
		t.Errorf("Expected 5 requests blocked, got %d", blocked)
	}
}

func TestMakeRequest(t *testing.T) {
	// Test successful request
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok": true, "result": "test"}`))
	}))
	defer server.Close()
	
	cfg := &config.Config{
		APITimeout:     5 * time.Second,
		APIRateLimit:   100,
		APIMinInterval: 0,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	ctx := context.Background()
	resp, err := client.makeRequest(ctx, "GET", server.URL, nil)
	
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	
	expected := `{"ok": true, "result": "test"}`
	if string(resp) != expected {
		t.Errorf("Expected response %s, got %s", expected, string(resp))
	}
}

func TestMakeRequestError(t *testing.T) {
	// Test error response
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": "internal server error"}`))
	}))
	defer server.Close()
	
	cfg := &config.Config{
		APITimeout:     5 * time.Second,
		APIRateLimit:   100,
		APIMinInterval: 0,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	ctx := context.Background()
	_, err := client.makeRequest(ctx, "GET", server.URL, nil)
	
	if err == nil {
		t.Fatal("Expected error for 500 status code")
	}
}

func TestMakeRequestWithBody(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("Expected POST method, got %s", r.Method)
		}
		
		if r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("Expected Content-Type application/json, got %s", r.Header.Get("Content-Type"))
		}
		
		var body map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}
		
		if body["test"] != "value" {
			t.Errorf("Expected test=value in body, got %v", body["test"])
		}
		
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok": true}`))
	}))
	defer server.Close()
	
	cfg := &config.Config{
		APITimeout:     5 * time.Second,
		APIRateLimit:   100,
		APIMinInterval: 0,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	ctx := context.Background()
	body := map[string]string{"test": "value"}
	
	_, err := client.makeRequest(ctx, "POST", server.URL, body)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
}

func TestRetryWithBackoff(t *testing.T) {
	cfg := &config.Config{
		RetryAttempts:  3,
		RetryBaseDelay: 10 * time.Millisecond,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	attemptCount := 0
	ctx := context.Background()
	
	// Test successful retry
	err := client.retryWithBackoff(ctx, func() error {
		attemptCount++
		if attemptCount < 2 {
			return http.ErrServerClosed // Simulate temporary failure
		}
		return nil // Success on second attempt
	})
	
	if err != nil {
		t.Fatalf("Expected no error after successful retry, got %v", err)
	}
	
	if attemptCount != 2 {
		t.Errorf("Expected 2 attempts, got %d", attemptCount)
	}
}

func TestRetryWithBackoffFailure(t *testing.T) {
	cfg := &config.Config{
		RetryAttempts:  2,
		RetryBaseDelay: 10 * time.Millisecond,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	attemptCount := 0
	ctx := context.Background()
	
	// Test failure after all retries
	err := client.retryWithBackoff(ctx, func() error {
		attemptCount++
		return http.ErrServerClosed // Always fail
	})
	
	if err == nil {
		t.Fatal("Expected error after failed retries")
	}
	
	if attemptCount != 2 {
		t.Errorf("Expected 2 attempts, got %d", attemptCount)
	}
}

func TestRetryWithBackoffContextCancel(t *testing.T) {
	cfg := &config.Config{
		RetryAttempts:  3,
		RetryBaseDelay: 100 * time.Millisecond,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	ctx, cancel := context.WithCancel(context.Background())
	
	attemptCount := 0
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()
	
	err := client.retryWithBackoff(ctx, func() error {
		attemptCount++
		return http.ErrServerClosed // Always fail
	})
	
	if err != context.Canceled {
		t.Errorf("Expected context.Canceled, got %v", err)
	}
	
	if attemptCount != 1 {
		t.Errorf("Expected 1 attempt before cancel, got %d", attemptCount)
	}
}

func TestWaitForRateLimit(t *testing.T) {
	cfg := &config.Config{
		APIRateLimit:   1,
		APIMinInterval: 50 * time.Millisecond,
	}
	log := logger.NewDefault()
	client := NewClient(cfg, log)
	
	// First call should be immediate
	start := time.Now()
	client.waitForRateLimit()
	elapsed := time.Since(start)
	
	if elapsed > 10*time.Millisecond {
		t.Errorf("Expected first call to be immediate, took %v", elapsed)
	}
	
	// Second call should wait due to min interval
	start = time.Now()
	client.waitForRateLimit()
	elapsed = time.Since(start)
	
	if elapsed < 40*time.Millisecond {
		t.Errorf("Expected second call to wait at least 40ms, took %v", elapsed)
	}
}