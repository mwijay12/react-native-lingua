import { useLearningHydrationStatus } from "@/store/learningStore";

// Screens that read or change progress wait for a successful storage read.
export function useLearningHydration() {
  return useLearningHydrationStatus((state) => state.status);
}
