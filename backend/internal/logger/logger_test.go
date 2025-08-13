package logger

import (
	"bytes"
	"strings"
	"testing"
)

func TestNew(t *testing.T) {
	var buf bytes.Buffer
	logger := New(INFO, &buf)
	
	if logger == nil {
		t.Fatal("Expected logger to be created")
	}
	
	if logger.level != INFO {
		t.Errorf("Expected level INFO, got %v", logger.level)
	}
	
	// Test with nil output (should use os.Stdout)
	logger2 := New(DEBUG, nil)
	if logger2 == nil {
		t.Fatal("Expected logger to be created with nil output")
	}
}

func TestNewDefault(t *testing.T) {
	logger := NewDefault()
	
	if logger == nil {
		t.Fatal("Expected default logger to be created")
	}
	
	if logger.level != INFO {
		t.Errorf("Expected default level INFO, got %v", logger.level)
	}
}

func TestLogLevels(t *testing.T) {
	tests := []struct {
		name         string
		loggerLevel  LogLevel
		testLevel    LogLevel
		shouldOutput bool
	}{
		{"DEBUG logger with DEBUG message", DEBUG, DEBUG, true},
		{"DEBUG logger with INFO message", DEBUG, INFO, true},
		{"DEBUG logger with ERROR message", DEBUG, ERROR, true},
		{"INFO logger with DEBUG message", INFO, DEBUG, false},
		{"INFO logger with INFO message", INFO, INFO, true},
		{"INFO logger with ERROR message", INFO, ERROR, true},
		{"ERROR logger with DEBUG message", ERROR, DEBUG, false},
		{"ERROR logger with INFO message", ERROR, INFO, false},
		{"ERROR logger with ERROR message", ERROR, ERROR, true},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			logger := New(tt.loggerLevel, &buf)
			
			switch tt.testLevel {
			case DEBUG:
				logger.Debug("test message")
			case INFO:
				logger.Info("test message")
			case ERROR:
				logger.Error("test message")
			}
			
			output := buf.String()
			if tt.shouldOutput && output == "" {
				t.Errorf("Expected output but got none")
			}
			if !tt.shouldOutput && output != "" {
				t.Errorf("Expected no output but got: %s", output)
			}
		})
	}
}

func TestLogMethods(t *testing.T) {
	var buf bytes.Buffer
	logger := New(DEBUG, &buf)
	
	// Test Debug methods
	logger.Debug("debug message")
	if !strings.Contains(buf.String(), "DEBUG:") {
		t.Error("Expected DEBUG prefix in debug message")
	}
	if !strings.Contains(buf.String(), "debug message") {
		t.Error("Expected debug message content")
	}
	
	buf.Reset()
	logger.Debugf("debug %s", "formatted")
	if !strings.Contains(buf.String(), "debug formatted") {
		t.Error("Expected formatted debug message")
	}
	
	// Test Info methods
	buf.Reset()
	logger.Info("info message")
	if !strings.Contains(buf.String(), "INFO:") {
		t.Error("Expected INFO prefix in info message")
	}
	
	buf.Reset()
	logger.Infof("info %d", 123)
	if !strings.Contains(buf.String(), "info 123") {
		t.Error("Expected formatted info message")
	}
	
	// Test Warn methods
	buf.Reset()
	logger.Warn("warn message")
	if !strings.Contains(buf.String(), "WARN:") {
		t.Error("Expected WARN prefix in warn message")
	}
	
	buf.Reset()
	logger.Warnf("warn %s", "test")
	if !strings.Contains(buf.String(), "warn test") {
		t.Error("Expected formatted warn message")
	}
	
	// Test Error methods
	buf.Reset()
	logger.Error("error message")
	if !strings.Contains(buf.String(), "ERROR:") {
		t.Error("Expected ERROR prefix in error message")
	}
	
	buf.Reset()
	logger.Errorf("error %d", 456)
	if !strings.Contains(buf.String(), "error 456") {
		t.Error("Expected formatted error message")
	}
}

func TestSetGetLevel(t *testing.T) {
	logger := New(INFO, nil)
	
	if logger.GetLevel() != INFO {
		t.Errorf("Expected initial level INFO, got %v", logger.GetLevel())
	}
	
	logger.SetLevel(ERROR)
	if logger.GetLevel() != ERROR {
		t.Errorf("Expected level ERROR after setting, got %v", logger.GetLevel())
	}
	
	// Test that level change affects logging
	var buf bytes.Buffer
	logger = New(INFO, &buf)
	logger.Debug("should not appear")
	if buf.String() != "" {
		t.Error("Expected no debug output at INFO level")
	}
	
	logger.SetLevel(DEBUG)
	logger.Debug("should appear")
	if buf.String() == "" {
		t.Error("Expected debug output after setting to DEBUG level")
	}
}

func TestDefaultLoggerFunctions(t *testing.T) {
	// Just test that they don't panic and can be called
	// We can't easily test the actual output without affecting the global logger
	
	Debug("test debug")
	Debugf("test debug %s", "formatted")
	Info("test info")
	Infof("test info %d", 123)
	Warn("test warn")
	Warnf("test warn %s", "formatted")
	Error("test error")
	Errorf("test error %d", 456)
	
	// Test SetLevel on default logger
	oldLevel := defaultLogger.GetLevel()
	SetLevel(ERROR)
	if defaultLogger.GetLevel() != ERROR {
		t.Errorf("Expected default logger level ERROR, got %v", defaultLogger.GetLevel())
	}
	
	// Restore original level
	SetLevel(oldLevel)
}

func TestLogLevelNames(t *testing.T) {
	expectedNames := map[LogLevel]string{
		DEBUG: "DEBUG",
		INFO:  "INFO",
		WARN:  "WARN",
		ERROR: "ERROR",
		FATAL: "FATAL",
	}
	
	for level, expectedName := range expectedNames {
		if name, exists := levelNames[level]; !exists || name != expectedName {
			t.Errorf("Expected level %v to have name '%s', got '%s'", level, expectedName, name)
		}
	}
}