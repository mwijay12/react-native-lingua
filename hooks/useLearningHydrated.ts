import { useEffect, useState } from "react";

import { useLearningStore } from "@/store/learningStore";

// Do not allow goal/review writes before saved progress has been loaded.
export function useLearningHydrated() {
  const [hydrated, setHydrated] = useState(useLearningStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useLearningStore.persist.onFinishHydration(() => setHydrated(true));
    if (useLearningStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, []);

  return hydrated;
}
