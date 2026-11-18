import type { AsyncStorageStatic } from "@react-native-async-storage/async-storage";
import type { StateStorage } from "zustand/middleware";

// AsyncStorage's native getItem maps an empty string to null. That would make
// damaged saved data look like a new profile. multiGet preserves empty strings
// on native and web, so the protected stores can reject them as invalid JSON.
export function protectedAsyncStorage(storage: AsyncStorageStatic): StateStorage {
  return {
    getItem: async (name) => {
      const entries = await storage.multiGet([name]);
      if (entries.length !== 1 || entries[0][0] !== name
        || (entries[0][1] !== null && typeof entries[0][1] !== "string")) {
        throw new Error("Unexpected AsyncStorage read result");
      }
      return entries[0][1];
    },
    setItem: (name, value) => storage.setItem(name, value),
    removeItem: (name) => storage.removeItem(name),
  };
}
