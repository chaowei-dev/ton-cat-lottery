package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"ton-cat-lottery/backend/internal/health"
	"ton-cat-lottery/backend/pkg/logger"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize logger
	logger.Init()

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize router
	router := mux.NewRouter()

	// Health check endpoint
	router.HandleFunc("/health", health.Handler).Methods("GET")
	router.HandleFunc("/", rootHandler).Methods("GET")

	// Log startup
	logger.Info(fmt.Sprintf("TON Cat Lottery Backend starting on port %s", port))

	// Start server
	srv := &http.Server{
		Handler:      router,
		Addr:         ":" + port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	response := `{
		"service": "TON Cat Lottery Backend",
		"status": "running",
		"version": "0.1.0",
		"message": "Backend service is ready for DevOps deployment"
	}`

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(response))
}
