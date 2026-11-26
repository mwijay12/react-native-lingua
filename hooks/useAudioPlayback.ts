import { useIsFocused } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { PRONUNCIATION_NORMAL_RATE } from "@/constants/audio";
import { pronunciationCoordinator } from "@/lib/pronunciationCoordinator";

// Explicit, bundled speech samples do not use the effects mute switch. Stop on
// navigation or app-state changes, and cancel pending seeks before another play.
export function useAudioPlayback(source: number) {
  const player = useAudioPlayer(source);
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const active = useRef(AppState.currentState == null || AppState.currentState === "active");
  const mounted = useRef(false);
  const request = useRef(0);
  const owner = useRef({}).current;
  const [error, setError] = useState(false);

  const stop = useCallback(() => {
    request.current += 1;
    pronunciationCoordinator.release(owner);
    try { player.pause(); } catch { /* The player may already have been released. */ }
  }, [owner, player]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!focused) stop();
  }, [focused, stop]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      active.current = state === "active";
      // Do not automatically resume a sample after an interruption.
      stop();
    });
    return () => subscription.remove();
  }, [stop]);

  const play = useCallback((rate = PRONUNCIATION_NORMAL_RATE) => {
    if (!mounted.current || !focusedRef.current || !active.current) return;
    pronunciationCoordinator.claim(owner, stop);
    const thisRequest = ++request.current;
    setError(false);
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(rate, "high");
      void player.seekTo(0).then(() => {
        if (mounted.current && focusedRef.current && active.current && request.current === thisRequest) player.play();
      }).catch(() => {
        if (mounted.current && request.current === thisRequest) {
          pronunciationCoordinator.release(owner);
          setError(true);
        }
      });
    } catch {
      pronunciationCoordinator.release(owner);
      if (mounted.current) setError(true);
    }
  }, [owner, player, stop]);

  return { play, stop, error };
}
