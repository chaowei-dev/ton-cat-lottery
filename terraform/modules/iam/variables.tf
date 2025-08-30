variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "resource_labels" {
  description = "Common resource labels"
  type        = map(string)
  default     = {}
}