// Only one explicit pronunciation sample may play at a time, even if two
// lesson screens remain mounted in the navigation stack.
export function createPronunciationCoordinator() {
  let current: { owner: object; stop: () => void } | null = null;
  return {
    claim(owner: object, stop: () => void) {
      const previous = current;
      current = null;
      try { previous?.stop(); } catch { /* A previous player may be released. */ }
      current = { owner, stop };
    },
    release(owner: object) {
      if (current?.owner === owner) current = null;
    },
  };
}

export const pronunciationCoordinator = createPronunciationCoordinator();
