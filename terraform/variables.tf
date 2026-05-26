variable "compartment_ocid" {
  description = "Oracle Cloud compartment OCID"
  type        = string
}

variable "region" {
  description = "Oracle Cloud region"
  type        = string
  default     = "us-ashburn-1"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository URL for ArgoCD"
  type        = string
  default     = "https://github.com/dev-lou/SiteSync"
}

variable "domain_name" {
  description = "Domain name for the application (e.g., sitesync.example.com)"
  type        = string
  default     = "sitesync.example.com"
}

variable "environment" {
  description = "Deployment environment (production, staging, development)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development."
  }
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}
