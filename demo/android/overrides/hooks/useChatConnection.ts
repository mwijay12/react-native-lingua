// The isolated test build has no account or backend and cannot send messages.
export function useChatConnection() {
  return {
    endpoint: null,
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    getToken: async (): Promise<string | null> => null,
  };
}
