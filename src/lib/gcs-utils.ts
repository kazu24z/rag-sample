import { Storage } from '@google-cloud/storage';

let storage: Storage;

/**
 * Storageインスタンスを初期化（環境変数からキーファイルパスを取得）
 */
function getStorage(keyFilename?: string): Storage {
	if (!storage) {
		storage = new Storage(keyFilename ? { keyFilename } : undefined);
	}
	return storage;
}

/**
 * GCS URIから署名付きURLを生成
 * @param gcsUri gs://bucket-name/path/to/file 形式のURI
 * @param expiresIn 有効期限（秒）デフォルト: 1時間
 * @param keyFilename サービスアカウントキーのパス（オプション）
 * @returns 署名付きURL
 */
export async function generateSignedUrl(
	gcsUri: string,
	expiresIn: number = 3600,
	keyFilename?: string
): Promise<string> {
	try {
		// gs://bucket-name/path/to/file から bucket-name と path を抽出
		const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/);
		if (!match) {
			throw new Error(`Invalid GCS URI format: ${gcsUri}`);
		}

		const [, bucketName, filePath] = match;

		const storageClient = getStorage(keyFilename);
		const bucket = storageClient.bucket(bucketName);
		const file = bucket.file(filePath);

		// 署名付きURLを生成（読み取り専用、1時間有効）
		const [url] = await file.getSignedUrl({
			version: 'v4',
			action: 'read',
			expires: Date.now() + expiresIn * 1000
		});

		return url;
	} catch (error) {
		console.error('Error generating signed URL:', error);
		throw new Error(
			`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * 複数のGCS URIから署名付きURLを生成
 */
export async function generateSignedUrls(
	gcsUris: string[],
	expiresIn: number = 3600,
	keyFilename?: string
): Promise<Map<string, string>> {
	const urlMap = new Map<string, string>();

	await Promise.all(
		gcsUris.map(async (uri) => {
			try {
				const signedUrl = await generateSignedUrl(uri, expiresIn, keyFilename);
				urlMap.set(uri, signedUrl);
			} catch (error) {
				console.error(`Failed to generate signed URL for ${uri}:`, error);
				// エラーの場合は元のURIを使用
				urlMap.set(uri, uri);
			}
		})
	);

	return urlMap;
}
