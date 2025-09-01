package logger

import (
	"log"
	"os"
)

var (
	InfoLogger  *log.Logger
	ErrorLogger *log.Logger
)

func Init() {
	InfoLogger = log.New(os.Stdout, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	ErrorLogger = log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)
}

func Info(msg string) {
	if InfoLogger != nil {
		InfoLogger.Println(msg)
	} else {
		log.Println("INFO:", msg)
	}
}

func Error(msg string) {
	if ErrorLogger != nil {
		ErrorLogger.Println(msg)
	} else {
		log.Println("ERROR:", msg)
	}
}
