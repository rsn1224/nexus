import log from '../lib/logger';

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

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function getOptimizationSuggestions(processNames: string[]): Promise<string[]> {
  if (!API_KEY) {
    log.error('PERPLEXITY_API_KEY is not set');
    throw new Error('PERPLEXITY_API_KEY が未設定です');
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
    max_tokens: 500,
  };

  try {
    log.info('Sending request to Perplexity API');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in Perplexity response');
    }

    // 番号付きリストを配列に変換
    const suggestions = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 3);

    log.info(`Received ${suggestions.length} suggestions from Perplexity`);
    return suggestions;
  } catch (error) {
    log.error({ error }, 'Failed to get suggestions from Perplexity');
    throw new Error('AI提案の取得に失敗しました');
  }
}
