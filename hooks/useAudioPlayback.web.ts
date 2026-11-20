import { useIsFocused } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { PRONUNCIATION_NORMAL_RATE } from "@/constants/audio";
import { pronunciationCoordinator } from "@/lib/pronunciationCoordinator";
import { createWebAudioPlayback } from "@/lib/webAudioPlayback";

// Browser playback stays in the user gesture, and its promise can report
// autoplay or loading failures instead of silently dropping the sample.
export function useAudioPlayback(source: number) {
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const active = useRef(AppState.currentState == null || AppState.currentState === "active");
  const mounted = useRef(false);
  const owner = useRef({}).current;
  const playback = useRef<ReturnType<typeof createWebAudioPlayback> | null>(null);
  const [error, setError] = useState(false);

  const stop = useCallback(() => {
    pronunciationCoordinator.release(owner);
    playback.current?.stop();
  }, [owner]);

  useEffect(() => {
    mounted.current = true;
    try {
      const media = new Audio(Asset.fromModule(source).uri);
      playback.current = createWebAudioPlayback(media, () => {
        pronunciationCoordinator.release(owner);
        if (mounted.current) setError(true);
      });
    } catch {
      setError(true);
    }
    return () => {
      mounted.current = false;
      stop();
      playback.current?.dispose();
      playback.current = null;
    };
  }, [owner, source, stop]);

  useEffect(() => {
    if (!focused) stop();
  }, [focused, stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      active.current = state === "active";
      stop();
    });
    return () => subscription.remove();
  }, [stop]);

  const play = useCallback((rate = PRONUNCIATION_NORMAL_RATE) => {
    if (!mounted.current || !focusedRef.current || !active.current) return;
    setError(false);
    if (playback.current) {
      pronunciationCoordinator.claim(owner, stop);
      playback.current.play(rate);
    } else setError(true);
  }, [owner, stop]);

  return { play, stop, error };
}
