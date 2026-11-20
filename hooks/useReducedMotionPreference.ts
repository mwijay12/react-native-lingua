import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Unknown is distinct from "reduce motion" so the launch screen can wait
// briefly for the preference without accidentally playing motion first.
export function useResolvedReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let changed = false;
    // Never leave startup waiting forever for an unsupported or stalled API.
    const timeout = setTimeout(() => {
      if (mounted) setReducedMotion((current) => current ?? true);
    }, 250);
    let subscription: { remove: () => void } | undefined;

    try {
      subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
        changed = true;
        clearTimeout(timeout);
        if (mounted) setReducedMotion(enabled);
      });
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          clearTimeout(timeout);
          if (mounted && !changed) setReducedMotion(enabled);
        })
        .catch(() => {
          clearTimeout(timeout);
          if (mounted && !changed) setReducedMotion(true);
        });
    } catch {
      clearTimeout(timeout);
      if (mounted) setReducedMotion(true);
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.remove();
    };
  }, []);

  return reducedMotion;
}

// Other screens remain still until the device preference is known.
export function useReducedMotionPreference() {
  return useResolvedReducedMotionPreference() !== false;
}
