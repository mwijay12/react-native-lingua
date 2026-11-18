import type { StateStorage } from "zustand/middleware";

export type HydrationFailure = "read" | "corrupt" | "newer" | "migration";
export type SaveStatus = "idle" | "saving" | "saved" | "error";
type HydrationStatus = "loading" | "ready" | "error";

export class StorageProblem extends Error {
  constructor(readonly reason: HydrationFailure) {
    super(`Storage problem: ${reason}`);
  }
}

function savedVersion(raw: string, currentVersion: number, validateState: (state: unknown, version: number) => boolean): number {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageProblem("corrupt");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new StorageProblem("corrupt");
  const envelope = parsed as Record<string, unknown>;
  const version = envelope.version;
  if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 0) throw new StorageProblem("corrupt");
  if (version > currentVersion) throw new StorageProblem("newer");
  if (Object.keys(envelope).some((key) => key !== "state" && key !== "version")
    || !validateState(envelope.state, version)) {
    throw new StorageProblem("corrupt");
  }
  return version;
}

// Zustand does not await ordinary action writes, but does await a migration
// write during hydration. Serialize full snapshots and reject only migration
// failures, so normal failures are visible without unhandled rejections.
export function createProtectedStorage({ storage, version, validateState, hydrationStatus, setSaveStatus }: {
  storage: StateStorage;
  version: number;
  validateState: (state: unknown, version: number) => boolean;
  hydrationStatus: () => HydrationStatus;
  setSaveStatus: (status: SaveStatus) => void;
}) {
  let pendingWrite: Promise<void> = Promise.resolve();
  let latestWrite = 0;
  let migrationExpected = false;
  let lastReadHadValue = false;
  let seenValue = false;

  const guarded: StateStorage = {
    getItem: async (name) => {
      migrationExpected = false;
      let raw: string | null;
      try {
        raw = await storage.getItem(name);
      } catch {
        throw new StorageProblem("read");
      }
      if (raw === null) {
        // A value that disappeared after we had seen it is not a new profile.
        if (seenValue) throw new StorageProblem("read");
        lastReadHadValue = false;
        return null;
      }
      seenValue = true;
      if (typeof raw !== "string") throw new StorageProblem("corrupt");
      const storedVersion = savedVersion(raw, version, validateState);
      migrationExpected = storedVersion < version;
      lastReadHadValue = true;
      return raw;
    },
    setItem: (name, value) => {
      const phase = hydrationStatus();
      const migrating = phase === "loading" && migrationExpected;
      // Never write a default or in-memory state over data that was not read.
      if (phase !== "ready" && !migrating) return Promise.resolve();
      if (migrating) migrationExpected = false;

      const sequence = ++latestWrite;
      setSaveStatus("saving");
      const write = pendingWrite.then(async () => {
        // An invalid in-memory snapshot must not replace a good saved value.
        if (savedVersion(value, version, validateState) !== version) throw new StorageProblem("corrupt");
        await storage.setItem(name, value);
        seenValue = true;
      });
      // Keep the queue usable after a failure; each later snapshot is complete.
      pendingWrite = write.then(() => undefined, () => undefined);
      return write.then(
        () => {
          if (sequence === latestWrite) setSaveStatus("saved");
        },
        () => {
          if (sequence === latestWrite) setSaveStatus("error");
          if (migrating) throw new StorageProblem("migration");
        },
      );
    },
    // There is no reset feature in the app. Recovery must never delete data.
    removeItem: () => { throw new Error("Protected progress cannot be cleared by storage recovery."); },
  };

  return {
    storage: guarded,
    finishHydration: () => setSaveStatus(lastReadHadValue ? "saved" : "idle"),
  };
}

// Re-reading while unsaved changes exist would replace the latest memory state
// with an older disk snapshot. Also avoid overlapping retries from double taps.
export function protectRehydration(
  persist: { rehydrate: () => Promise<void> | void },
  hydrationStatus: () => HydrationStatus,
  saveStatus: () => SaveStatus,
) {
  const rehydrate = persist.rehydrate;
  persist.rehydrate = () => {
    const hydration = hydrationStatus();
    const save = saveStatus();
    if (hydration === "loading" || (hydration === "ready" && (save === "saving" || save === "error"))) {
      return Promise.resolve();
    }
    return rehydrate();
  };
}
