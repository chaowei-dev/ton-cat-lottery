package logger

import (
	"log/slog"
	"os"
	"strings"
)

// Logger 包裝標準日誌系統，提供結構化日誌
type Logger struct {
	*slog.Logger
}

// New 創建新的日誌器
func New(level string) *Logger {
	// 設定日誌級別
	var logLevel slog.Level
	switch strings.ToLower(level) {
	case "debug":
		logLevel = slog.LevelDebug
	case "info":
		logLevel = slog.LevelInfo
	case "warn", "warning":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	// 創建處理器配置
	opts := &slog.HandlerOptions{
		Level:     logLevel,
		AddSource: true,
	}

	// 使用 JSON 格式的處理器
	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler)

	return &Logger{Logger: logger}
}

// Debug 記錄除錯訊息
func (l *Logger) Debug(msg string, args ...any) {
	l.Logger.Debug(msg, args...)
}

// Info 記錄一般訊息
func (l *Logger) Info(msg string, args ...any) {
	l.Logger.Info(msg, args...)
}

// Warn 記錄警告訊息
func (l *Logger) Warn(msg string, args ...any) {
	l.Logger.Warn(msg, args...)
}

// Error 記錄錯誤訊息
func (l *Logger) Error(msg string, args ...any) {
	l.Logger.Error(msg, args...)
}

// Fatal 記錄致命錯誤並結束程序
func (l *Logger) Fatal(msg string, args ...any) {
	l.Logger.Error(msg, args...)
	os.Exit(1)
}

// With 添加上下文欄位
func (l *Logger) With(args ...any) *Logger {
	return &Logger{Logger: l.Logger.With(args...)}
}

// WithGroup 創建帶群組的日誌器
func (l *Logger) WithGroup(name string) *Logger {
	return &Logger{Logger: l.Logger.WithGroup(name)}
}
