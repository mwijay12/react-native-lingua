import { useIsFocused } from "@react-navigation/native";
import { Asset } from "expo-asset";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { createWebAudioPlayback } from "@/lib/webAudioPlayback";

// Native uses expo-audio. On the web, use the browser's media element directly
// so its play promise can report autoplay and loading failures to the learner.
export function useAudioPlayback(source: number) {
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const active = useRef(AppState.currentState == null || AppState.currentState === "active");
  const mounted = useRef(false);
  const playback = useRef<ReturnType<typeof createWebAudioPlayback> | null>(null);
  const [error, setError] = useState(false);

  const stop = useCallback(() => playback.current?.stop(), []);

  useEffect(() => {
    mounted.current = true;
    try {
      const media = new Audio(Asset.fromModule(source).uri);
      playback.current = createWebAudioPlayback(media, () => {
        if (mounted.current) setError(true);
      });
    } catch {
      setError(true);
    }
    return () => {
      mounted.current = false;
      playback.current?.dispose();
      playback.current = null;
    };
  }, [source]);

  useEffect(() => {
    if (!focused) stop();
  }, [focused, stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      active.current = state === "active";
      // Do not automatically resume a sample or chime after an interruption.
      stop();
    });
    return () => subscription.remove();
  }, [stop]);

  const play = useCallback(() => {
    if (!mounted.current || !focusedRef.current || !active.current) return;
    setError(false);
    if (playback.current) playback.current.play();
    else setError(true);
  }, []);

  return { play, stop, error };
}
