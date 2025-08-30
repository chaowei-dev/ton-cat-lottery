variable "environments" {
  description = "List of environments to create namespaces for"
  type        = list(string)
  default     = ["production", "staging"]
}