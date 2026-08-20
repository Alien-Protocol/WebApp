"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getState, subscribe, type ProtocolState } from "@/lib/mock/store";

export function useProtocolState(): ProtocolState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useProtocolSelector<T>(selector: (s: ProtocolState) => T): T {
  const get = useCallback(() => selector(getState()), [selector]);
  return useSyncExternalStore(subscribe, get, get);
}
