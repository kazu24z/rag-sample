<script lang="ts">
  import { useChat } from "@ai-sdk/svelte";

  const { messages, input, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  // テキスト内のURLとマークダウンリンクをHTMLに変換する関数
  function linkifyContent(text: string): string {
    // マークダウン形式のリンク [テキスト](URL) を先に変換
    let result = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="gcs-link">$1</a>'
    );
    
    // 生のHTTPS URLをリンク化
    result = result.replace(
      /(?<![">])(https:\/\/[^\s\)<]+)(?![^<]*<\/a>)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="gcs-link">$1</a>'
    );
    
    // gs:// で始まるURLも検出（念のため）
    result = result.replace(
      /gs:\/\/([^\s\)]+)/g,
      (match, path) => {
        const httpsUrl = `https://storage.googleapis.com/${path}`;
        return `<a href="${httpsUrl}" target="_blank" rel="noopener noreferrer" class="gcs-link">${match}</a>`;
      }
    );
    
    return result;
  }
</script>

<svelte:head>
  <title>VertexAI Search RAG</title>
</svelte:head>

<div class="container">
  <header>
    <h1>🔍 VertexAI Search RAG</h1>
    <p>Ask questions and get answers from your knowledge base</p>
  </header>

  <main class="chat-container">
    <div class="messages">
      {#if $messages.length === 0}
        <div class="empty-state">
          <p>👋 こんにちは！何か質問はありますか？</p>
          <p class="hint">ドキュメントから関連情報を検索して回答します</p>
        </div>
      {:else}
        {#each $messages as message}
          <div class="message {message.role}">
            <div class="message-header">
              {#if message.role === "user"}
                <span class="icon">👤</span>
                <span class="role-label">You</span>
              {:else}
                <span class="icon">🤖</span>
                <span class="role-label">Assistant</span>
              {/if}
            </div>
            <div class="message-content">
              {@html linkifyContent(message.content)}
            </div>
            {#if message.toolInvocations && message.toolInvocations.length > 0}
              <div class="tool-invocations">
                {#each message.toolInvocations as tool}
                  <div class="tool-call">
                    <span class="tool-icon">🔧</span>
                    {#if tool.toolName === "findDocuments"}
                      <span>検索中: "{tool.args.query}"</span>
                    {/if}
                    {#if tool.state === "result" && tool.result}
                      <div class="tool-result">
                        ✅ {tool.result.count || 0} 件の結果を取得
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}

      {#if $isLoading}
        <div class="message assistant loading">
          <div class="message-header">
            <span class="icon">🤖</span>
            <span class="role-label">Assistant</span>
          </div>
          <div class="message-content">
            <span class="thinking">考え中...</span>
          </div>
        </div>
      {/if}

      {#if $error}
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          <span>エラー: {$error.message}</span>
        </div>
      {/if}
    </div>

    <form on:submit={handleSubmit} class="input-form">
      <input
        type="text"
        bind:value={$input}
        placeholder="質問を入力してください..."
        disabled={$isLoading}
        class="input-field"
      />
      <button
        type="submit"
        disabled={$isLoading || !$input.trim()}
        class="send-button"
      >
        {#if $isLoading}
          ⏳
        {:else}
          送信
        {/if}
      </button>
    </form>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    text-align: center;
    color: white;
    margin-bottom: 2rem;
  }

  header h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  header p {
    margin: 0.5rem 0 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }

  .chat-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 400px;
    max-height: 600px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #666;
  }

  .empty-state p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  .hint {
    font-size: 0.9rem !important;
    opacity: 0.7;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .icon {
    font-size: 1.2rem;
  }

  .user .message-header {
    color: #667eea;
  }

  .assistant .message-header {
    color: #764ba2;
  }

  .message-content {
    background: #f7f9fc;
    padding: 1rem;
    border-radius: 0.75rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    margin-left: 2rem;
  }

  .assistant .message-content {
    background: #f7f9fc;
    color: #333;
    margin-right: 2rem;
  }

  .loading .message-content {
    background: #f0f0f0;
  }

  .thinking {
    color: #999;
    font-style: italic;
  }

  .tool-invocations {
    margin-left: 2rem;
    padding: 0.75rem;
    background: #e8f4fd;
    border-left: 3px solid #4a90e2;
    border-radius: 0.5rem;
    font-size: 0.85rem;
  }

  .tool-call {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: #2c5aa0;
  }

  .tool-icon {
    margin-right: 0.25rem;
  }

  .tool-result {
    margin-top: 0.25rem;
    color: #16a34a;
    font-weight: 500;
  }

  .error-message {
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    color: #c00;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .gcs-link {
    color: #4a90e2;
    text-decoration: none;
    border-bottom: 1px solid #4a90e2;
    transition: all 0.2s;
    word-break: break-all;
  }

  .gcs-link:hover {
    color: #2c5aa0;
    border-bottom-color: #2c5aa0;
    background: rgba(74, 144, 226, 0.1);
  }

  .input-form {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
  }

  .input-field {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .input-field:focus {
    border-color: #667eea;
  }

  .input-field:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .send-button {
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    white-space: nowrap;
  }

  .send-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 640px) {
    .container {
      padding: 1rem 0.5rem;
    }

    header h1 {
      font-size: 1.75rem;
    }

    .messages {
      padding: 1rem;
      min-height: 300px;
    }

    .input-form {
      padding: 1rem;
    }

    .send-button {
      padding: 0.875rem 1rem;
    }
  }
</style>
