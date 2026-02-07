variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "rag-sample-486711"
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "asia-northeast1"
}

variable "location" {
  description = "Location for VertexAI Search (global or region)"
  type        = string
  default     = "global"
}

variable "bucket_name" {
  description = "GCS Bucket name for documents"
  type        = string
  default     = "rag-sample-01"
}

variable "data_store_id" {
  description = "VertexAI Search Data Store ID"
  type        = string
  default     = "rag-sample-datastore_1770468726494"
}

variable "search_engine_id" {
  description = "VertexAI Search Engine ID"
  type        = string
  default     = "rag-sample_1770468754860"
}
