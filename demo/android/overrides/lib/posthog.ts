// The Android demo does not collect or send analytics.
export const posthog = {
  capture: (..._args: unknown[]) => {},
};
