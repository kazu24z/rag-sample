import { streamText, tool } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { searchDocuments, formatSearchResults } from '$lib/vertex-search';
import { generateSignedUrls } from '$lib/gcs-utils';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages } = await request.json();

		// Gemini API キーの確認
		if (!env.GEMINI_API_KEY) {
			return new Response(
				JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Vercel AI SDK で streamText を使用
		const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
		const result = await streamText({
			model: google('gemini-2.5-flash'),
			system: `You are a helpful document search assistant with access to a document finder tool.

Your primary function is to help users find documents from the knowledge base.

When using the findDocuments tool, present the results in a clear, user-friendly format:
- List the document title
- Include the file name
- Provide a clickable download link (show "ダウンロード" as link text, not the full URL)

Example format:
"以下の資料が見つかりました：

1. **ルームエアコン** (26X取説.pdf)
   [ダウンロード]

2. **洗濯機取扱説明書** (na-fw100k8.pdf)
   [ダウンロード]"

IMPORTANT: 
- Use markdown link format: [ダウンロード](downloadUrl)
- Always use the downloadUrl field from the tool result, NOT the gcsUri field
- Do NOT show the full URL in the text, only as the href in the markdown link

If no documents are found, politely inform the user and suggest alternative search terms.`,
			messages,
			tools: {
				findDocuments: tool({
					description:
						'Find and list documents from the knowledge base. Returns document titles, file names, and GCS links. Use this when user asks to search for, find, or list documents/files/materials.',
					parameters: z.object({
						query: z.string().describe('The search query to find documents'),
						maxResults: z
							.number()
							.optional()
							.default(5)
							.describe('Maximum number of results to return (default: 5)')
					}),
					execute: async ({ query, maxResults = 5 }) => {
						console.log(`Finding documents for: "${query}" (max: ${maxResults} results)`);

						try {
							const results = await searchDocuments(query, maxResults);

							console.log(`Found ${results.length} documents`);

							// GCS URIのリストを抽出
							const gcsUris = results
								.map((doc) => doc.uri)
								.filter((uri): uri is string => !!uri);

							// 署名付きURLを生成
							const keyFilename = env.GOOGLE_APPLICATION_CREDENTIALS;
							const signedUrlMap = await generateSignedUrls(gcsUris, 3600, keyFilename);

							// ファイル情報のみを返す（内容は含めない）
							return {
								success: true,
								query,
								count: results.length,
								documents: results.map((doc) => ({
									title: doc.title,
									fileName: doc.uri ? doc.uri.split('/').pop() : 'unknown',
									gcsUri: doc.uri,
									downloadUrl: doc.uri ? signedUrlMap.get(doc.uri) || doc.uri : undefined
								}))
							};
						} catch (error) {
							console.error('Search error:', error);
							return {
								success: false,
								error:
									error instanceof Error ? error.message : 'Unknown search error',
								query
							};
						}
					}
				})
			},
			maxSteps: 5,
			temperature: 0.7,
			onError: ({ error }) => {
				console.error('streamText error:', error);
			}
		});

		// ストリーミングレスポンスを返す
		return result.toDataStreamResponse();
	} catch (error) {
		console.error('Chat API error:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to process chat request',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
