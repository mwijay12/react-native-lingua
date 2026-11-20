import { useAuth } from "@clerk/expo";
import { Platform } from "react-native";

import { resolveChatEndpoint } from "@/lib/chatClient";

// The URL is public configuration for our own backend, not a provider key.
// No request is made unless the app has both a trusted endpoint and a session.
export function useChatConnection() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const endpoint = resolveChatEndpoint(process.env.EXPO_PUBLIC_CHAT_API_URL, Platform.OS);
  return { endpoint, isLoaded: !!isLoaded, isSignedIn: !!isSignedIn, userId: userId ?? null, getToken };
}
