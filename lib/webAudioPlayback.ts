// The web version of expo-audio does not expose the promise from media.play().
// Keep the browser's rejection available so a blocked or failed sample can
// show a useful fallback instead of producing an unhandled rejection.
export function createWebAudioPlayback(media: HTMLMediaElement, onError: () => void) {
  let generation = 0;
  let requested = false;
  let disposed = false;

  const reportMediaError = () => {
    if (!disposed && requested) {
      requested = false;
      onError();
    }
  };
  media.addEventListener("error", reportMediaError);

  const stop = () => {
    generation += 1;
    requested = false;
    try { media.pause(); } catch { /* The element may already be released. */ }
  };

  return {
    play() {
      if (disposed) return;
      const current = ++generation;
      requested = true;
      const reportFailure = () => {
        if (!disposed && requested && generation === current) {
          requested = false;
          onError();
        }
      };
      try {
        media.pause();
        media.currentTime = 0;
        // Call play synchronously within the user's gesture, not after an
        // awaited seek, so browsers can honor their autoplay policies.
        const started = media.play();
        if (started) void started.catch(reportFailure);
      } catch {
        reportFailure();
      }
    },
    stop,
    dispose() {
      if (disposed) return;
      stop();
      disposed = true;
      media.removeEventListener("error", reportMediaError);
      try {
        media.removeAttribute("src");
        media.load();
      } catch { /* Releasing audio is best-effort. */ }
    },
  };
}
