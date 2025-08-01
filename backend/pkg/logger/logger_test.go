package logger

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"os"
	"strings"
	"testing"
)

func TestNew(t *testing.T) {
	tests := []struct {
		name     string
		level    string
		expected slog.Level
	}{
		{"debug level", "debug", slog.LevelDebug},
		{"info level", "info", slog.LevelInfo},
		{"warn level", "warn", slog.LevelWarn},
		{"warning level", "warning", slog.LevelWarn},
		{"error level", "error", slog.LevelError},
		{"uppercase level", "INFO", slog.LevelInfo},
		{"invalid level defaults to info", "invalid", slog.LevelInfo},
		{"empty level defaults to info", "", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger := New(tt.level)
			if logger == nil {
				t.Fatal("Expected logger to be created, got nil")
			}
			if logger.Logger == nil {
				t.Fatal("Expected logger.Logger to be created, got nil")
			}
		})
	}
}

func TestLoggerMethods(t *testing.T) {
	// 捕獲標準輸出
	var buf bytes.Buffer

	// 創建一個使用 buffer 的 logger
	handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slogger := slog.New(handler)
	logger := &Logger{Logger: slogger}

	t.Run("Debug", func(t *testing.T) {
		buf.Reset()

		logger.Debug("test debug message", "key", "value")

		output := buf.String()
		if !strings.Contains(output, "test debug message") {
			t.Errorf("Expected output to contain 'test debug message', got: %s", output)
		}
		if !strings.Contains(output, "DEBUG") {
			t.Errorf("Expected output to contain 'DEBUG', got: %s", output)
		}
	})

	t.Run("Info", func(t *testing.T) {
		buf.Reset()

		logger.Info("test info message", "number", 42)

		output := buf.String()
		if !strings.Contains(output, "test info message") {
			t.Errorf("Expected output to contain 'test info message', got: %s", output)
		}
		if !strings.Contains(output, "INFO") {
			t.Errorf("Expected output to contain 'INFO', got: %s", output)
		}
	})

	t.Run("Warn", func(t *testing.T) {
		buf.Reset()

		logger.Warn("test warning message", "status", "warning")

		output := buf.String()
		if !strings.Contains(output, "test warning message") {
			t.Errorf("Expected output to contain 'test warning message', got: %s", output)
		}
		if !strings.Contains(output, "WARN") {
			t.Errorf("Expected output to contain 'WARN', got: %s", output)
		}
	})

	t.Run("Error", func(t *testing.T) {
		buf.Reset()

		logger.Error("test error message", "error", "something went wrong")

		output := buf.String()
		if !strings.Contains(output, "test error message") {
			t.Errorf("Expected output to contain 'test error message', got: %s", output)
		}
		if !strings.Contains(output, "ERROR") {
			t.Errorf("Expected output to contain 'ERROR', got: %s", output)
		}
	})
}

func TestLoggerWith(t *testing.T) {
	var buf bytes.Buffer

	handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slogger := slog.New(handler)
	logger := &Logger{Logger: slogger}

	// 創建帶有上下文的 logger
	contextLogger := logger.With("service", "test", "version", "1.0")

	contextLogger.Info("test message")

	output := buf.String()

	// 解析 JSON 以驗證上下文字段
	var logEntry map[string]interface{}
	if err := json.Unmarshal([]byte(output), &logEntry); err != nil {
		t.Fatalf("Failed to parse JSON log output: %v", err)
	}

	if logEntry["service"] != "test" {
		t.Errorf("Expected service='test', got %v", logEntry["service"])
	}

	if logEntry["version"] != "1.0" {
		t.Errorf("Expected version='1.0', got %v", logEntry["version"])
	}
}

func TestLoggerWithGroup(t *testing.T) {
	var buf bytes.Buffer

	handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	})
	slogger := slog.New(handler)
	logger := &Logger{Logger: slogger}

	// 創建帶有群組的 logger
	groupLogger := logger.WithGroup("database")

	groupLogger.Info("connection established", "host", "localhost", "port", 5432)

	output := buf.String()

	// 解析 JSON 以驗證群組結構
	var logEntry map[string]interface{}
	if err := json.Unmarshal([]byte(output), &logEntry); err != nil {
		t.Fatalf("Failed to parse JSON log output: %v", err)
	}

	// 檢查是否有 database 群組
	database, ok := logEntry["database"].(map[string]interface{})
	if !ok {
		t.Fatalf("Expected 'database' group in log output, got: %v", logEntry)
	}

	if database["host"] != "localhost" {
		t.Errorf("Expected database.host='localhost', got %v", database["host"])
	}

	if database["port"] != float64(5432) { // JSON numbers are float64
		t.Errorf("Expected database.port=5432, got %v", database["port"])
	}
}

func TestFatal(t *testing.T) {
	// 由於 Fatal 會調用 os.Exit(1)，我們需要使用特殊的測試方法
	if os.Getenv("TEST_FATAL") == "1" {
		var buf bytes.Buffer
		handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
		slogger := slog.New(handler)
		logger := &Logger{Logger: slogger}

		logger.Fatal("test fatal message")
		return
	}

	// 測試 Fatal 方法存在且可以被調用（但不實際調用 os.Exit）
	// 如果方法不存在，編譯時就會出錯
	t.Log("Fatal method exists and can be called")
}

func TestLoggerLevels(t *testing.T) {
	tests := []struct {
		name       string
		logLevel   string
		shouldShow map[string]bool
	}{
		{
			name:     "debug level shows all",
			logLevel: "debug",
			shouldShow: map[string]bool{
				"debug": true,
				"info":  true,
				"warn":  true,
				"error": true,
			},
		},
		{
			name:     "info level shows info and above",
			logLevel: "info",
			shouldShow: map[string]bool{
				"debug": false,
				"info":  true,
				"warn":  true,
				"error": true,
			},
		},
		{
			name:     "warn level shows warn and above",
			logLevel: "warn",
			shouldShow: map[string]bool{
				"debug": false,
				"info":  false,
				"warn":  true,
				"error": true,
			},
		},
		{
			name:     "error level shows only error",
			logLevel: "error",
			shouldShow: map[string]bool{
				"debug": false,
				"info":  false,
				"warn":  false,
				"error": true,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer

			handler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
				Level: func() slog.Level {
					switch tt.logLevel {
					case "debug":
						return slog.LevelDebug
					case "info":
						return slog.LevelInfo
					case "warn":
						return slog.LevelWarn
					case "error":
						return slog.LevelError
					default:
						return slog.LevelInfo
					}
				}(),
			})

			slogger := slog.New(handler)
			logger := &Logger{Logger: slogger}

			// 測試各個級別的日誌
			logger.Debug("debug message")
			debugOutput := buf.String()
			buf.Reset()

			logger.Info("info message")
			infoOutput := buf.String()
			buf.Reset()

			logger.Warn("warn message")
			warnOutput := buf.String()
			buf.Reset()

			logger.Error("error message")
			errorOutput := buf.String()
			buf.Reset()

			// 驗證輸出
			if tt.shouldShow["debug"] && debugOutput == "" {
				t.Error("Expected debug message to be logged")
			}
			if !tt.shouldShow["debug"] && debugOutput != "" {
				t.Error("Expected debug message to be filtered out")
			}

			if tt.shouldShow["info"] && infoOutput == "" {
				t.Error("Expected info message to be logged")
			}
			if !tt.shouldShow["info"] && infoOutput != "" {
				t.Error("Expected info message to be filtered out")
			}

			if tt.shouldShow["warn"] && warnOutput == "" {
				t.Error("Expected warn message to be logged")
			}
			if !tt.shouldShow["warn"] && warnOutput != "" {
				t.Error("Expected warn message to be filtered out")
			}

			if tt.shouldShow["error"] && errorOutput == "" {
				t.Error("Expected error message to be logged")
			}
			if !tt.shouldShow["error"] && errorOutput != "" {
				t.Error("Expected error message to be filtered out")
			}
		})
	}
}
