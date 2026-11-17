import { useIsFocused } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

// A small, replayable local clip. Stop on navigation or app-state changes;
// pending seeks must not start a clip after the screen has been left.
export function useAudioPlayback(source: number) {
  const player = useAudioPlayer(source);
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const active = useRef(AppState.currentState == null || AppState.currentState === "active");
  const mounted = useRef(false);
  const request = useRef(0);
  const [error, setError] = useState(false);

  const stop = useCallback(() => {
    request.current += 1;
    try { player.pause(); } catch { /* The player may already have been released. */ }
  }, [player]);

  useEffect(() => {
    mounted.current = true;
    // Expo's web player does not release its media element for a local source
    // on unmount. Replacing it here also supports React's development remount.
    if (Platform.OS === "web") player.replace(source);
    return () => {
      mounted.current = false;
      stop();
      if (Platform.OS === "web") player.remove();
    };
  }, [player, source, stop]);

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
    const thisRequest = ++request.current;
    setError(false);
    try {
      player.pause();
      void player.seekTo(0).then(() => {
        if (mounted.current && focusedRef.current && active.current && request.current === thisRequest) player.play();
      }).catch(() => {
        if (mounted.current && request.current === thisRequest) setError(true);
      });
    } catch {
      if (mounted.current) setError(true);
    }
  }, [player]);

  return { play, stop, error };
}
