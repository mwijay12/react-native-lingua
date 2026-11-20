import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { useChatConnection } from "@/hooks/useChatConnection";
import { ChatRequestError, chatErrorMessage, requestChatReply, type ChatMessage } from "@/lib/chatClient";
import type { LanguageCode } from "@/types/learning";

const REQUEST_TIMEOUT_MS = 25_000;
type ActiveRequest = { controller: AbortController; timeout: ReturnType<typeof setTimeout> };

// This conversation is deliberately in memory only. Changing course or account
// cancels an outstanding request and clears the previous person's conversation.
export function useChatConversation(language: LanguageCode | null) {
  const connection = useChatConnection();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const active = useRef<ActiveRequest | null>(null);

  const cancelActive = useCallback(() => {
    const request = active.current;
    active.current = null;
    if (request) {
      clearTimeout(request.timeout);
      request.controller.abort();
    }
  }, []);

  const clear = useCallback(() => {
    cancelActive();
    setMessages([]);
    setDraft("");
    setError(null);
    setSending(false);
    setConnected(false);
  }, [cancelActive]);

  useEffect(() => { clear(); }, [clear, language, connection.userId]);
  useEffect(() => () => cancelActive(), [cancelActive]);

  const changeDraft = (value: string) => {
    setDraft(value);
    setError(null);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || active.current) return;
    if (!language) {
      setError("Choose a course before starting a chat.");
      return;
    }
    if (!connection.endpoint) {
      setError(chatErrorMessage(new ChatRequestError("configuration")));
      return;
    }
    if (!connection.isLoaded || !connection.isSignedIn || !connection.userId) {
      setError(chatErrorMessage(new ChatRequestError("authentication")));
      return;
    }

    const controller = new AbortController();
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    const request: ActiveRequest = {
      controller,
      timeout: setTimeout(() => {
        if (active.current !== request) return;
        active.current = null;
        controller.abort();
        setMessages((current) => current.slice(0, -1));
        setDraft(text);
        setSending(false);
        setConnected(false);
        setError("The chat service took too long. Your draft is still here.");
      }, REQUEST_TIMEOUT_MS),
    };
    active.current = request; // Prevent a second tap before React re-renders.
    setMessages(next);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      let token: string | null;
      try {
        token = await connection.getToken();
      } catch {
        throw new ChatRequestError("authentication");
      }
      if (active.current !== request) return;
      const reply = await requestChatReply({
        endpoint: connection.endpoint, platform: Platform.OS, token, language, messages: next, signal: controller.signal,
      });
      if (active.current !== request) return;
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setConnected(true);
    } catch (problem) {
      if (active.current !== request) return;
      setMessages((current) => current.slice(0, -1));
      setDraft(text);
      setConnected(false);
      setError(chatErrorMessage(problem));
    } finally {
      if (active.current === request) {
        clearTimeout(request.timeout);
        active.current = null;
        setSending(false);
      }
    }
  };

  const status = connected ? "Connected" : !connection.endpoint ? "AI connection needed"
    : !connection.isLoaded ? "Checking account" : !connection.isSignedIn ? "Sign in to connect" : "Ready to connect";

  return { messages, draft, error, sending, status, changeDraft, send, clear };
}
