package contract

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"ton-cat-lottery-backend/internal/config"
	"ton-cat-lottery-backend/internal/logger"
)

type Client struct {
	httpClient   *http.Client
	config       *config.Config
	logger       *logger.Logger
	rateLimiter  *RateLimiter
	lastRequest  time.Time
	requestMutex sync.Mutex
}

type RateLimiter struct {
	requests    []time.Time
	maxRequests int
	interval    time.Duration
	mutex       sync.Mutex
}

func NewRateLimiter(maxRequests int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		requests:    make([]time.Time, 0),
		maxRequests: maxRequests,
		interval:    interval,
	}
}

func (rl *RateLimiter) Allow() bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.interval)

	newRequests := make([]time.Time, 0)
	for _, req := range rl.requests {
		if req.After(cutoff) {
			newRequests = append(newRequests, req)
		}
	}
	rl.requests = newRequests

	if len(rl.requests) >= rl.maxRequests {
		return false
	}

	rl.requests = append(rl.requests, now)
	return true
}

func NewClient(cfg *config.Config, log *logger.Logger) *Client {
	httpClient := &http.Client{
		Timeout: cfg.APITimeout,
		Transport: &http.Transport{
			MaxIdleConns:        10,
			MaxIdleConnsPerHost: 5,
			IdleConnTimeout:     30 * time.Second,
		},
	}

	rateLimiter := NewRateLimiter(cfg.APIRateLimit, time.Minute)

	return &Client{
		httpClient:  httpClient,
		config:      cfg,
		logger:      log,
		rateLimiter: rateLimiter,
	}
}

func (c *Client) waitForRateLimit() {
	c.requestMutex.Lock()
	defer c.requestMutex.Unlock()

	if !c.rateLimiter.Allow() {
		c.logger.Debug("Rate limit reached, waiting...")
		time.Sleep(c.config.APIMinInterval)
	}

	timeSinceLastRequest := time.Since(c.lastRequest)
	if timeSinceLastRequest < c.config.APIMinInterval {
		waitTime := c.config.APIMinInterval - timeSinceLastRequest
		c.logger.Debugf("Waiting %v before next request", waitTime)
		time.Sleep(waitTime)
	}

	c.lastRequest = time.Now()
}

func (c *Client) makeRequest(ctx context.Context, method, url string, body interface{}) ([]byte, error) {
	c.waitForRateLimit()

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("User-Agent", "ton-cat-lottery-backend/1.0")

	c.logger.Debugf("Making %s request to %s", method, url)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func (c *Client) retryWithBackoff(ctx context.Context, operation func() error) error {
	var lastErr error

	for attempt := 0; attempt < c.config.RetryAttempts; attempt++ {
		if attempt > 0 {
			delay := time.Duration(attempt) * c.config.RetryBaseDelay
			c.logger.Warnf("Retrying operation after %v (attempt %d/%d)", delay, attempt+1, c.config.RetryAttempts)

			select {
			case <-time.After(delay):
			case <-ctx.Done():
				return ctx.Err()
			}
		}

		if err := operation(); err != nil {
			lastErr = err
			c.logger.Warnf("Operation failed (attempt %d/%d): %v", attempt+1, c.config.RetryAttempts, err)
			continue
		}

		return nil
	}

	return fmt.Errorf("operation failed after %d attempts, last error: %w", c.config.RetryAttempts, lastErr)
}
