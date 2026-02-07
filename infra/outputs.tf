output "bucket_name" {
  description = "GCS Bucket name for documents"
  value       = google_storage_bucket.documents.name
}

output "bucket_url" {
  description = "GCS Bucket URL"
  value       = "gs://${google_storage_bucket.documents.name}"
}

output "data_store_id" {
  description = "VertexAI Search Data Store ID"
  value       = google_discovery_engine_data_store.documents.data_store_id
}

output "search_engine_id" {
  description = "VertexAI Search Engine ID"
  value       = google_discovery_engine_search_engine.rag_engine.engine_id
}

output "search_engine_name" {
  description = "Full VertexAI Search Engine resource name"
  value       = google_discovery_engine_search_engine.rag_engine.name
}

output "service_account_email" {
  description = "Service Account email"
  value       = google_service_account.vertex_search.email
}

output "setup_instructions" {
  description = "Next steps to complete setup"
  value = <<-EOT
    
    ✅ Terraform resources created successfully!
    
    Next steps:
    
    1. Add to your .env file:
       VERTEX_SEARCH_ENGINE_ID=${google_discovery_engine_search_engine.rag_engine.engine_id}
       GOOGLE_CLOUD_PROJECT_ID=${var.project_id}
    
    2. Upload documents to GCS:
       gsutil cp your-documents.pdf ${google_storage_bucket.documents.url}/
    
    3. Wait for indexing (check Cloud Console)
    
    4. Run the application:
       npm install --ignore-scripts
       npm run dev
  EOT
}
