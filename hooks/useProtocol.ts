"use client";

import { useCallback, useSyncExternalStore } from "react";
import { protocol } from "@/lib/protocol";
import type { ProtocolSnapshot } from "@/lib/protocol/types";

export function useProtocolState(): ProtocolSnapshot {
  return useSyncExternalStore(
    protocol.subscribe,
    protocol.getSnapshot,
    protocol.getSnapshot,
  );
}

export function useProtocolSelector<T>(selector: (s: ProtocolSnapshot) => T): T {
  const get = useCallback(() => selector(protocol.getSnapshot()), [selector]);
  return useSyncExternalStore(protocol.subscribe, get, get);
}
