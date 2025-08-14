package logger

import (
	"io"
	"log"
	"os"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
	FATAL
)

var levelNames = map[LogLevel]string{
	DEBUG: "DEBUG",
	INFO:  "INFO",
	WARN:  "WARN",
	ERROR: "ERROR",
	FATAL: "FATAL",
}

type Logger struct {
	debugLogger *log.Logger
	infoLogger  *log.Logger
	warnLogger  *log.Logger
	errorLogger *log.Logger
	fatalLogger *log.Logger
	level       LogLevel
}

func New(level LogLevel, output io.Writer) *Logger {
	if output == nil {
		output = os.Stdout
	}

	flags := log.LstdFlags | log.Lshortfile

	return &Logger{
		debugLogger: log.New(output, "DEBUG: ", flags),
		infoLogger:  log.New(output, "INFO: ", flags),
		warnLogger:  log.New(output, "WARN: ", flags),
		errorLogger: log.New(output, "ERROR: ", flags),
		fatalLogger: log.New(output, "FATAL: ", flags),
		level:       level,
	}
}

func NewDefault() *Logger {
	return New(INFO, os.Stdout)
}

func (l *Logger) Debug(v ...interface{}) {
	if l.level <= DEBUG {
		l.debugLogger.Println(v...)
	}
}

func (l *Logger) Debugf(format string, v ...interface{}) {
	if l.level <= DEBUG {
		l.debugLogger.Printf(format, v...)
	}
}

func (l *Logger) Info(v ...interface{}) {
	if l.level <= INFO {
		l.infoLogger.Println(v...)
	}
}

func (l *Logger) Infof(format string, v ...interface{}) {
	if l.level <= INFO {
		l.infoLogger.Printf(format, v...)
	}
}

func (l *Logger) Warn(v ...interface{}) {
	if l.level <= WARN {
		l.warnLogger.Println(v...)
	}
}

func (l *Logger) Warnf(format string, v ...interface{}) {
	if l.level <= WARN {
		l.warnLogger.Printf(format, v...)
	}
}

func (l *Logger) Error(v ...interface{}) {
	if l.level <= ERROR {
		l.errorLogger.Println(v...)
	}
}

func (l *Logger) Errorf(format string, v ...interface{}) {
	if l.level <= ERROR {
		l.errorLogger.Printf(format, v...)
	}
}

func (l *Logger) Fatal(v ...interface{}) {
	l.fatalLogger.Println(v...)
	os.Exit(1)
}

func (l *Logger) Fatalf(format string, v ...interface{}) {
	l.fatalLogger.Printf(format, v...)
	os.Exit(1)
}

func (l *Logger) SetLevel(level LogLevel) {
	l.level = level
}

func (l *Logger) GetLevel() LogLevel {
	return l.level
}

var defaultLogger = NewDefault()

func Debug(v ...interface{}) {
	defaultLogger.Debug(v...)
}

func Debugf(format string, v ...interface{}) {
	defaultLogger.Debugf(format, v...)
}

func Info(v ...interface{}) {
	defaultLogger.Info(v...)
}

func Infof(format string, v ...interface{}) {
	defaultLogger.Infof(format, v...)
}

func Warn(v ...interface{}) {
	defaultLogger.Warn(v...)
}

func Warnf(format string, v ...interface{}) {
	defaultLogger.Warnf(format, v...)
}

func Error(v ...interface{}) {
	defaultLogger.Error(v...)
}

func Errorf(format string, v ...interface{}) {
	defaultLogger.Errorf(format, v...)
}

func Fatal(v ...interface{}) {
	defaultLogger.Fatal(v...)
}

func Fatalf(format string, v ...interface{}) {
	defaultLogger.Fatalf(format, v...)
}

func SetLevel(level LogLevel) {
	defaultLogger.SetLevel(level)
}
