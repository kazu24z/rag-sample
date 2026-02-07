# Terraform Configuration for VertexAI Search RAG

## 前提条件

- Terraform >= 1.0
- Google Cloud アカウント
- gcloud CLI インストール済み
- 適切な権限を持つ GCP プロジェクト

## 使い方

### 1. 認証

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### 2. 変数ファイルの作成

`terraform.tfvars` ファイルを作成：

```hcl
project_id      = "your-gcp-project-id"
region          = "us-central1"
location        = "global"
bucket_name     = "your-unique-bucket-name"
data_store_id   = "rag-documents-store"
search_engine_id = "rag-search-engine"
```

### 3. Terraform 実行

```bash
terraform init
terraform plan
terraform apply
```

### 4. 出力の確認

```bash
terraform output
```

`VERTEX_SEARCH_ENGINE_ID` の値をコピーして `.env` ファイルに設定します。

## 作成されるリソース

- **GCS Bucket**: ドキュメント保存用
- **VertexAI Search Data Store**: アンストラクチャドデータストア
- **VertexAI Search Engine**: 検索エンジン（LLM アドオン付き）
- **Service Account**: VertexAI Search 用
- **IAM Bindings**: 必要な権限

## クリーンアップ

リソースを削除する場合：

```bash
terraform destroy
```

**注意**: GCS バケット内のデータも削除されます。

## トラブルシューティング

### API が有効化されていない

Terraform が自動的に API を有効化しますが、数分かかる場合があります。
エラーが出た場合は再度 `terraform apply` を実行してください。

### 権限エラー

以下の権限が必要です：
- Discovery Engine Admin
- Storage Admin
- Service Account Admin
- Project IAM Admin

### バケット名の競合

GCS バケット名はグローバルに一意である必要があります。
`bucket_name` を変更してください。
