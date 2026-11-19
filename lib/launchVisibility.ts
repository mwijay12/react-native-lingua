import { createContext } from "react";

// Screens mounted beneath the launch overlay wait to play their own entrance.
// The default keeps isolated screens/previews usable without a launch gate.
export const LaunchVisibilityContext = createContext(true);
