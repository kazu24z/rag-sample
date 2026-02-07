terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

# Enable required APIs
resource "google_project_service" "cloudresourcemanager" {
  project = var.project_id
  service = "cloudresourcemanager.googleapis.com"

  disable_on_destroy = false
}

resource "google_project_service" "iam" {
  project = var.project_id
  service = "iam.googleapis.com"

  disable_on_destroy = false
  depends_on         = [google_project_service.cloudresourcemanager]
}

resource "google_project_service" "discoveryengine" {
  project = var.project_id
  service = "discoveryengine.googleapis.com"

  disable_on_destroy = false
  depends_on         = [google_project_service.cloudresourcemanager]
}

resource "google_project_service" "storage" {
  project = var.project_id
  service = "storage.googleapis.com"

  disable_on_destroy = false
  depends_on         = [google_project_service.cloudresourcemanager]
}

# GCS Bucket for documents
resource "google_storage_bucket" "documents" {
  name          = var.bucket_name
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 365
    }
  }

  depends_on = [google_project_service.storage]
}

# Service Account for RAG Application Backend
resource "google_service_account" "app_backend" {
  account_id   = "rag-app-backend-sa"
  display_name = "RAG Application Backend Service Account"
  description  = "Service account for RAG application backend (VertexAI Search + GCS access)"

  depends_on = [google_project_service.iam]
}

# IAM: Discovery Engine User (for search API)
resource "google_project_iam_member" "discovery_engine_user" {
  project = var.project_id
  role    = "roles/discoveryengine.user"
  member  = "serviceAccount:${google_service_account.app_backend.email}"
}

# IAM: Storage Object Viewer (for GCS read access)
resource "google_storage_bucket_iam_member" "bucket_viewer" {
  bucket = google_storage_bucket.documents.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.app_backend.email}"
}

# IAM: Service Account Token Creator (for signed URLs)
resource "google_service_account_iam_member" "token_creator" {
  service_account_id = google_service_account.app_backend.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.app_backend.email}"
}

# VertexAI Search Data Store
resource "google_discovery_engine_data_store" "documents" {
  location                    = var.location
  data_store_id               = var.data_store_id
  display_name                = "rag-sample-datastore"
  industry_vertical           = "GENERIC"
  content_config              = "CONTENT_REQUIRED"
  solution_types              = ["SOLUTION_TYPE_SEARCH"]
  create_advanced_site_search = false

  lifecycle {
    ignore_changes = [document_processing_config]
  }

  depends_on = [google_project_service.discoveryengine]
}

# VertexAI Search Engine
resource "google_discovery_engine_search_engine" "rag_engine" {
  engine_id         = var.search_engine_id
  collection_id     = "default_collection"
  location          = var.location
  display_name      = "rag-sample"
  industry_vertical = "GENERIC"

  data_store_ids = [google_discovery_engine_data_store.documents.data_store_id]

  search_engine_config {
    search_tier = "SEARCH_TIER_STANDARD"
  }

  common_config {
    company_name = "個人"
  }

  depends_on = [google_discovery_engine_data_store.documents]
}
