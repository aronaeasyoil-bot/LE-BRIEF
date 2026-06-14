import { ENV } from "./env";
import { invokeLLM } from "./llm";

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

function stringifyMessageContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: unknown }).type === "text" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return (part as { text: string }).text;
        }

        return JSON.stringify(part);
      })
      .join("\n");
  }

  return JSON.stringify(content);
}

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
    if (!ENV.forgeApiKey) {
      throw new Error("Neither OPENAI_API_KEY nor BUILT_IN_FORGE_API_KEY is configured");
    }

    const result = await invokeLLM({
      messages,
      responseFormat: { type: "json_object" },
    });
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Fallback LLM response did not include message content");
    }

    return extractJsonPayload(stringifyMessageContent(content)) as T;
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
