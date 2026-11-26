import { createAudioPlayer } from "expo-audio";

import type { EffectPlayer } from "@/lib/soundEffectsManager";

// createAudioPlayer prepares a bundled source immediately; avoiding
// downloadFirst also avoids a late source replacement after disposal.
export function createEffectPlayer(source: number, canContinue: () => boolean): EffectPlayer {
  const player = createAudioPlayer(source);
  let generation = 0;
  let disposed = false;

  const stop = () => {
    generation += 1;
    try { player.pause(); } catch { /* The player may already be released. */ }
  };

  return {
    play() {
      if (disposed || !canContinue()) return;
      const current = ++generation;
      try {
        player.pause();
        void player.seekTo(0).then(() => {
          if (!disposed && current === generation && canContinue()) {
            try { player.play(); } catch { /* Playback must not affect progress. */ }
          }
        }).catch(() => { /* A failed seek is non-fatal. */ });
      } catch { /* A released or unavailable player is non-fatal. */ }
    },
    stop,
    dispose() {
      if (disposed) return;
      stop();
      disposed = true;
      try { player.remove(); } catch { /* Best-effort release. */ }
    },
  };
}
