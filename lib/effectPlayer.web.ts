import { Asset } from "expo-asset";

import type { EffectPlayer } from "@/lib/soundEffectsManager";
import { createWebAudioPlayback } from "@/lib/webAudioPlayback";

// The browser must receive play() synchronously in the user's gesture. Each
// element is preloaded and owns its play promise, so rejection is harmless.
export function createEffectPlayer(source: number, canContinue: () => boolean): EffectPlayer {
  const media = new Audio(Asset.fromModule(source).uri);
  media.preload = "auto";
  media.load();
  const playback = createWebAudioPlayback(media, () => { /* Feedback is optional. */ });
  return {
    play: () => { if (canContinue()) playback.play(); },
    stop: playback.stop,
    dispose: playback.dispose,
  };
}
