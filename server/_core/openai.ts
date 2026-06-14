import { ENV } from "./env";

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

function extractJsonPayload(content: string) {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const startIndex = trimmed.indexOf("{");
    const endIndex = trimmed.lastIndexOf("}");
    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      throw new Error("OpenAI response did not contain a JSON object");
    }

    return JSON.parse(trimmed.slice(startIndex, endIndex + 1));
  }
}

export async function createOpenAiJsonCompletion<T>(
  messages: OpenAIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<T> {
  if (!ENV.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ENV.openAiModel,
      messages,
      response_format: { type: "json_object" },
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxTokens ?? 1800,
    }),
  });

  const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

  if (!response.ok) {
    const detail = payload?.error?.message || response.statusText;
    throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response did not include message content");
  }

  return extractJsonPayload(content) as T;
}
