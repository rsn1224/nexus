import log from '../lib/logger';
import { useAppSettingsStore } from '../stores/useAppSettingsStore';

// ─── Constants ───────────────────────────────────────────────────────────────

const PERPLEXITY_MAX_TOKENS = 500;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface PerplexityRequest {
  model: string;
  messages: Array<{
    role: 'user';
    content: string;
  }>;
  max_tokens?: number;
}

const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function getOptimizationSuggestions(
  processNames: string[],
): Promise<ApiResult<string[]>> {
  const apiKey = useAppSettingsStore.getState().perplexityApiKey;
  if (!apiKey) {
    log.error('Perplexity API key is not set');
    return { ok: false, error: 'Perplexity API キーが未設定です。設定画面で入力してください。' };
  }

  const prompt = `以下は現在 CPU を多く使用しているプロセスです:
${processNames.join(', ')}

これらのプロセスについて、パフォーマンス最適化の観点からアドバイスを3点、日本語で簡潔に教えてください。`;

  const request: PerplexityRequest = {
    model: 'sonar',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: PERPLEXITY_MAX_TOKENS,
  };

  try {
    log.info('Sending request to Perplexity API');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return { ok: false, error: 'No content in response' };
    }

    // 番号付きリストを配列に変換
    const suggestions = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    log.info(`Received ${suggestions.length} suggestions from Perplexity`);
    return { ok: true, data: suggestions };
  } catch (err) {
    log.error({ err }, 'Failed to get suggestions from Perplexity');
    return { ok: false, error: err instanceof Error ? err.message : 'AI提案の取得に失敗しました' };
  }
}

// APIキーの有効性をテスト
export async function testApiKey(apiKey: string): Promise<ApiResult<boolean>> {
  if (!apiKey.trim()) {
    return { ok: false, error: 'APIキーが空です' };
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        max_tokens: 1,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { ok: false, error: 'APIキーが無効です' };
      }
      return { ok: false, error: `HTTP ${response.status}` };
    }

    await response.json();

    // レスポンスがあればAPIキーは有効
    return { ok: true, data: true };
  } catch (err) {
    log.error({ err }, 'Failed to test API key');
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'APIキーのテストに失敗しました',
    };
  }
}
