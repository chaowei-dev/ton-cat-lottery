variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "resource_labels" {
  description = "Common resource labels"
  type        = map(string)
  default     = {}
}

variable "enable_workload_identity" {
  description = "Enable Workload Identity binding (requires GKE cluster to exist)"
  type        = bool
  default     = false
}