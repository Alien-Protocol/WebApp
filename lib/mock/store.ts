"use client";

import { ADDRESSES } from "@/lib/mock/constants";
import {
  blendedBps,
  collateralValueUsd,
  computeHf,
  holdingsToCollateral,
  utilizationBps,
  weightedLiqUsd,
} from "@/lib/mock/math";
import { createSeed, type SeedState } from "@/lib/mock/seed";
import type { Position } from "@/lib/mock/types";

export type ProtocolState = SeedState;

let state: ProtocolState = createSeed();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): ProtocolState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch: Partial<ProtocolState> | ((s: ProtocolState) => ProtocolState)) {
  state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
  emit();
}

export function resetState() {
  state = createSeed();
  emit();
}

export function derivePosition(user: string, s: ProtocolState = state): Position {
  const holdings = s.holdings[user] ?? {};
  const collateral = holdingsToCollateral(holdings, s.prices, s.assets);
  const value = collateralValueUsd(collateral);
  const debt = s.debts[user]?.total ?? 0;
  const weighted = weightedLiqUsd(collateral, s.assets);
  return {
    user,
    collateral,
    collateralValueUsd: value,
    healthFactor: computeHf(weighted, debt),
    maxLtvBps: blendedBps(collateral, s.assets, "maxLtvBps"),
    liquidationThresholdBps: blendedBps(
      collateral,
      s.assets,
      "liquidationThresholdBps",
    ),
  };
}

export function allUsers(): string[] {
  const keys = new Set([
    ...Object.keys(state.holdings),
    ...Object.keys(state.debts),
    ADDRESSES.you,
    ADDRESSES.whale,
    ADDRESSES.atRisk,
  ]);
  return [...keys];
}

export function refreshPoolDerived(s: ProtocolState): ProtocolState {
  const collateralTvl = allUsersFrom(s).reduce((sum, u) => {
    const c = holdingsToCollateral(s.holdings[u] ?? {}, s.prices, s.assets);
    return sum + collateralValueUsd(c);
  }, 0);
  const available = Math.max(0, s.pool.totalSupply - s.pool.totalBorrowed);
  return {
    ...s,
    pool: {
      ...s.pool,
      availableLiquidity: available,
      utilizationBps: utilizationBps(s.pool.totalBorrowed, s.pool.totalSupply),
      tvlUsd: collateralTvl + s.pool.totalSupply,
    },
  };
}

function allUsersFrom(s: ProtocolState): string[] {
  return [
    ...new Set([
      ...Object.keys(s.holdings),
      ...Object.keys(s.debts),
    ]),
  ];
}

export function pushEvent(
  event: Omit<ProtocolState["events"][number], "id" | "txHash" | "status"> & {
    id?: string;
    txHash?: string;
    status?: ProtocolState["events"][number]["status"];
  },
) {
  const id = event.id ?? `e${Date.now().toString(36)}`;
  setState((s) => ({
    ...s,
    events: [
      {
        status: "success",
        txHash: event.txHash ?? id.repeat(4).slice(0, 64),
        ...event,
        id,
      },
      ...s.events,
    ],
  }));
}
