package health

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthStatus struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Version   string    `json:"version"`
	Timestamp time.Time `json:"timestamp"`
	Message   string    `json:"message"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	status := HealthStatus{
		Status:    "healthy",
		Service:   "TON Cat Lottery Backend",
		Version:   "0.1.0",
		Timestamp: time.Now(),
		Message:   "Service is running and ready for DevOps deployment",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(status); err != nil {
		http.Error(w, "Failed to encode health status", http.StatusInternalServerError)
		return
	}
}