import { SearchServiceClient } from '@google-cloud/discoveryengine';

// 環境変数から設定を取得
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
const location = process.env.VERTEX_SEARCH_LOCATION || 'global';
const engineId = process.env.VERTEX_SEARCH_ENGINE_ID || '';

// VertexAI Search クライアント
let searchClient: SearchServiceClient | null = null;

/**
 * VertexAI Search クライアントを初期化
 */
function getSearchClient(): SearchServiceClient {
	if (!searchClient) {
		searchClient = new SearchServiceClient();
	}
	return searchClient;
}

/**
 * 検索結果の型定義
 */
export interface SearchResult {
	id: string;
	title: string;
	content: string;
	uri?: string;
}

/**
 * VertexAI Search で検索を実行
 * @param query 検索クエリ
 * @param maxResults 最大結果数（デフォルト: 5）
 * @returns 検索結果の配列
 */
export async function searchDocuments(
	query: string,
	maxResults: number = 5
): Promise<SearchResult[]> {
	try {
		// 環境変数のバリデーション
		if (!projectId || !engineId) {
			throw new Error(
				'GOOGLE_CLOUD_PROJECT_ID and VERTEX_SEARCH_ENGINE_ID must be set'
			);
		}

		const client = getSearchClient();

		// 検索エンジンのリソース名を構築
		const servingConfig = `projects/${projectId}/locations/${location}/collections/default_collection/engines/${engineId}/servingConfigs/default_config`;

		// 検索リクエストを作成
		const request = {
			servingConfig,
			query,
			pageSize: maxResults,
			queryExpansionSpec: {
				condition: 'AUTO' as const,
			},
			spellCorrectionSpec: {
				mode: 'AUTO' as const,
			},
		};

		// 検索を実行
		const [response] = await client.search(request);

		// 結果を整形
		const results: SearchResult[] = [];

		if (response.results) {
			for (const result of response.results) {
				const document = result.document;
				if (!document) continue;

				// ドキュメントから情報を抽出
				const structData = document.structData;
				const derivedStructData = document.derivedStructData;

				// タイトルとコンテンツを取得
				let title = '';
				let content = '';
				let uri = '';

				if (structData) {
					title = structData.fields?.title?.stringValue || '';
					content = structData.fields?.content?.stringValue || '';
					uri = structData.fields?.uri?.stringValue || '';
				}

				if (derivedStructData) {
					if (!title) {
						title = derivedStructData.fields?.title?.stringValue || '';
					}
					if (!content) {
						content =
							derivedStructData.fields?.extractive_answers?.listValue?.values?.[0]?.structValue?.fields?.content?.stringValue ||
							derivedStructData.fields?.snippets?.listValue?.values?.[0]?.structValue?.fields?.snippet?.stringValue ||
							'';
					}
					if (!uri) {
						uri = derivedStructData.fields?.link?.stringValue || '';
					}
				}

				results.push({
					id: document.id || '',
					title: title || 'Untitled',
					content: content || 'No content available',
					uri: uri || undefined,
				});
			}
		}

		return results;
	} catch (error) {
		console.error('Error searching documents:', error);
		throw new Error(
			`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * 検索結果をLLMに渡す形式に変換
 * @param results 検索結果
 * @returns フォーマットされたテキスト
 */
export function formatSearchResults(results: SearchResult[]): string {
	if (results.length === 0) {
		return 'No relevant documents found.';
	}

	return results
		.map((result, index) => {
			let formatted = `[${index + 1}] ${result.title}\n`;
			if (result.uri) {
				formatted += `URL: ${result.uri}\n`;
			}
			formatted += `Content: ${result.content}\n`;
			return formatted;
		})
		.join('\n---\n\n');
}
