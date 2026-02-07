import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { searchDocuments, formatSearchResults } from '$lib/vertex-search';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages } = await request.json();

		// Gemini API キーの確認
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			return new Response(
				JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		// Vercel AI SDK で streamText を使用
		const result = await streamText({
			model: google('gemini-2.5-flash', { apiKey }),
			messages,
			tools: {
				searchDocuments: {
					description:
						'Search for relevant documents using VertexAI Search. Use this when you need to find information from the knowledge base to answer user questions.',
					parameters: {
						type: 'object',
						properties: {
							query: {
								type: 'string',
								description: 'The search query to find relevant documents'
							},
							maxResults: {
								type: 'number',
								description: 'Maximum number of results to return (default: 5)',
								default: 5
							}
						},
						required: ['query']
					},
					execute: async ({ query, maxResults = 5 }) => {
						console.log(`Searching for: "${query}" (max: ${maxResults} results)`);

						try {
							const results = await searchDocuments(query, maxResults);
							const formattedResults = formatSearchResults(results);

							console.log(`Found ${results.length} results`);

							return {
								success: true,
								query,
								resultsCount: results.length,
								results: formattedResults
							};
						} catch (error) {
							console.error('Search error:', error);
							return {
								success: false,
								error: error instanceof Error ? error.message : 'Unknown search error',
								query
							};
						}
					}
				}
			},
			maxSteps: 5,
			temperature: 0.7
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
