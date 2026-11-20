import type { SoundEffect } from "@/constants/audio";

export interface EffectPlayer {
  play: () => void;
  stop: () => void;
  dispose: () => void;
}

// Two preloaded players per effect allow quick repeated taps to overlap.
// A third tap reuses the oldest player instead of allocating without bound.
const POOL_SIZE = 2;
const EFFECTS: SoundEffect[] = ["correct", "wrong", "celebration", "option"];

export function createSoundEffectsManager(
  createPlayer: (effect: SoundEffect, canContinue: () => boolean) => EffectPlayer,
  isEnabled: () => boolean,
) {
  const pools: Partial<Record<SoundEffect, EffectPlayer[]>> = {};
  const next: Partial<Record<SoundEffect, number>> = {};
  let started = false;
  let active = true;
  const canContinue = () => started && active && isEnabled();

  const stopAll = () => {
    for (const pool of Object.values(pools)) {
      for (const player of pool) {
        try { player.stop(); } catch { /* Audio is always best-effort. */ }
      }
    }
  };

  return {
    start() {
      if (started) return;
      started = true;
      for (const effect of EFFECTS) {
        const pool: EffectPlayer[] = [];
        pools[effect] = pool;
        next[effect] = 0;
        for (let index = 0; index < POOL_SIZE; index += 1) {
          try { pool.push(createPlayer(effect, canContinue)); } catch { /* Other effects can still work. */ }
        }
      }
    },
    play(effect: SoundEffect) {
      if (!canContinue()) return;
      const pool = pools[effect];
      if (!pool?.length) return;
      const index = (next[effect] ?? 0) % pool.length;
      next[effect] = (index + 1) % pool.length;
      try { pool[index].play(); } catch { /* Never interrupt an exercise. */ }
    },
    stopAll,
    setActive(value: boolean) {
      active = value;
      // Expo may automatically resume native players on foregrounding. Stop on
      // both transitions, and never replay an old effect after an interruption.
      stopAll();
    },
    dispose() {
      started = false;
      stopAll();
      for (const effect of EFFECTS) {
        for (const player of pools[effect] ?? []) {
          try { player.dispose(); } catch { /* It may already be released. */ }
        }
        delete pools[effect];
        delete next[effect];
      }
    },
  };
}
