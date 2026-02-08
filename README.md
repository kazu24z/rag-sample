# VertexAI Search RAG サンプル

VertexAI Search を RAG 検索ツールとして使用するシンプルなチャットアプリケーション。

<video src="media/demo.mov" controls width="600"></video>

## 技術スタック

- **フロントエンド**: SvelteKit
- **LLM**: Gemini API (Vercel AI SDK)
- **検索**: VertexAI Search
- **ストレージ**: Google Cloud Storage
- **IaC**: Terraform

## アーキテクチャ

```
ユーザー → SvelteKit UI → API Route → Vercel AI SDK
                                      ↓
                                   Gemini API
                                      ↓
                              検索Tool実行
                                      ↓
                              VertexAI Search → GCS
```

## セットアップ

### 1. 依存関係のインストール

**重要**: セキュリティのため、必ず `--ignore-scripts` オプションを付けること。

```bash
npm install --ignore-scripts
```

### 2. Google Cloud 認証

ローカル開発では Application Default Credentials を使用します。

```bash
gcloud auth application-default login
```

### 3. Terraform でインフラ構築

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

以下のリソースが作成されます：

- GCS バケット（ドキュメント保存用）
- VertexAI Search Data Store
- VertexAI Search Engine
- サービスアカウントと IAM 権限

### 4. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定します。

```bash
cp .env.example .env
```

必要な環境変数：

- `GEMINI_API_KEY`: Gemini API キー
- `GOOGLE_CLOUD_PROJECT_ID`: GCP プロジェクト ID
- `VERTEX_SEARCH_ENGINE_ID`: Terraform の output で表示される Search Engine ID
- `VERTEX_SEARCH_LOCATION`: リージョン（デフォルト: `global`）

### 5. ドキュメントのアップロード

GCS バケットにドキュメントをアップロードします。

```bash
gsutil cp your-documents.pdf gs://[BUCKET_NAME]/
```

対応フォーマット：

- PDF
- HTML
- TXT
- DOCX
- など

### 6. インデックス作成待機

VertexAI Search がドキュメントをインデックス化するまで待ちます（数分〜数十分）。

Cloud Console の Discovery Engine ページで進捗を確認できます。

### 7. アプリの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス。

## 使い方

1. チャット入力欄に質問を入力
2. Gemini が質問を解釈し、必要に応じて VertexAI Search で検索を実行
3. 検索結果を元に回答を生成
4. ストリーミングでレスポンスが表示される

## プロジェクト構成

```
rag-sample/
├── infra/              # インフラ定義
│   ├── main.tf            # メインリソース
│   ├── variables.tf       # 変数定義
│   └── outputs.tf         # 出力値
├── src/
│   ├── routes/
│   │   ├── +page.svelte   # チャット UI
│   │   └── api/
│   │       └── chat/
│   │           └── +server.ts  # チャット API
│   └── lib/
│       └── vertex-search.ts    # VertexAI Search クライアント
├── package.json
├── .env.example
└── README.md
```

## トラブルシューティング

### 認証エラー

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

### VertexAI Search が結果を返さない

- インデックス作成が完了しているか確認
- GCS バケットにドキュメントがアップロードされているか確認
- Cloud Console でデータストアの状態を確認

### API エラー

- `.env` ファイルの環境変数が正しく設定されているか確認
- Gemini API キーが有効か確認
- サービスアカウントに適切な権限があるか確認

## 注意事項

- これは学習用のサンプル実装です
- 本番環境では適切なエラーハンドリング、ログ、セキュリティ対策を追加してください
- VertexAI Search の料金に注意してください

## ライセンス

MIT
