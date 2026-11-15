import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Start still until the device preference is known. Listen for changes while
// the app is open; the static artwork is always present either way.
export function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      changed = true;
      if (mounted) setReducedMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted && !changed) setReducedMotion(enabled);
      })
      .catch(() => {
        // If the preference cannot be read, keep the safer still version.
      });
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reducedMotion;
}
