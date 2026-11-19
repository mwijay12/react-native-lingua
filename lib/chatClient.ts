import { fetch as expoFetch } from "expo/fetch";

import type { LanguageCode } from "@/types/learning";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export const CHAT_MESSAGE_LIMIT = 1200;
const REPLY_LIMIT = 4000;
// Five complete exchanges plus the new user message, never an unbounded history.
const HISTORY_LIMIT = 11;

type ChatErrorCode = "configuration" | "authentication" | "invalid-message" | "unavailable" | "rate-limit" | "network" | "response";

export class ChatRequestError extends Error {
  constructor(readonly code: ChatErrorCode) {
    super(code);
  }
}

// This is a public app setting, never an AI provider URL or a secret. Mobile
// builds require HTTPS; web may use the same-origin API path through its host.
export function resolveChatEndpoint(value: string | undefined, platform: string): string | null {
  const endpoint = value?.trim();
  if (!endpoint) return null;
  if (platform === "web" && endpoint === "/api/chat") return endpoint;
  try {
    const url = new URL(endpoint);
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (url.protocol !== "https:" || !host || url.username || url.password || url.search || url.hash
      || host === "localhost" || host.endsWith(".localhost") || host === "::1"
      || host === "0.0.0.0" || /^127\./.test(host)) return null;
    return endpoint;
  } catch {
    return null;
  }
}

export function chatErrorMessage(error: unknown): string {
  const code = error instanceof ChatRequestError ? error.code : "network";
  switch (code) {
    case "configuration":
    case "unavailable":
      return "AI chat isn't connected yet. Your draft is still here.";
    case "authentication":
      return "Please sign in again before sending. Your draft is still here.";
    case "invalid-message":
      return "Check your message and course, then try again.";
    case "rate-limit":
      return "Too many requests right now. Please wait and try again.";
    case "response":
      return "The chat service couldn't return a reply. Please try again.";
    default:
      return "Couldn't reach the chat service. Check your connection and try again.";
  }
}

// Only an authenticated application backend receives messages and the Clerk
// session token. Provider credentials must remain on that server. The bundled
// server route intentionally returns 503 until a secure provider is configured.
export async function requestChatReply({
  endpoint: configuredEndpoint, platform, token, language, messages, signal, fetcher = expoFetch,
}: {
  endpoint: string | null;
  platform: string;
  token: string | null;
  language: LanguageCode | null;
  messages: ChatMessage[];
  signal?: AbortSignal;
  fetcher?: typeof expoFetch;
}): Promise<string> {
  const endpoint = resolveChatEndpoint(configuredEndpoint ?? undefined, platform);
  if (!endpoint) throw new ChatRequestError("configuration");
  if (!token?.trim()) throw new ChatRequestError("authentication");
  if (!language || !["sw", "en", "fr"].includes(language) || messages.length === 0) {
    throw new ChatRequestError("invalid-message");
  }

  const recent = messages.slice(-HISTORY_LIMIT);
  if (recent.some((message, index) => !message || typeof message.content !== "string"
    || message.role !== (index % 2 === 0 ? "user" : "assistant")
    || !message.content.trim() || message.content.length > (message.role === "user" ? CHAT_MESSAGE_LIMIT : REPLY_LIMIT))
    || recent.at(-1)?.role !== "user") throw new ChatRequestError("invalid-message");
  const history = recent.map(({ role, content }) => ({ role, content: content.trim() }));
  if (signal?.aborted) throw new ChatRequestError("network");

  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "Cache-Control": "no-store", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ language, messages: history }),
      signal,
      credentials: "omit",
      // Expo's native fetch supports redirect:error; React Native's XHR-based
      // fetch may follow redirects before the client can inspect the response.
      redirect: "error",
    });
  } catch {
    throw new ChatRequestError("network");
  }
  if (response.status === 401 || response.status === 403) throw new ChatRequestError("authentication");
  if (response.status === 429) throw new ChatRequestError("rate-limit");
  if (response.status === 503) throw new ChatRequestError("unavailable");
  if (!response.ok) throw new ChatRequestError("response");

  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null || !("reply" in body)
      || typeof body.reply !== "string" || !body.reply.trim() || body.reply.length > REPLY_LIMIT) {
      throw new ChatRequestError("response");
    }
    return body.reply.trim();
  } catch {
    throw new ChatRequestError("response");
  }
}
