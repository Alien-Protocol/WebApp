import { ADDRESSES } from "@/lib/protocol/constants";
import {
  blendedBps,
  collateralValueUsd,
  computeHf,
  holdingsToCollateral,
  weightedLiqUsd,
} from "@/lib/protocol/math";
import type { Position, ProtocolSnapshot } from "@/lib/protocol/types";

export function derivePosition(
  user: string,
  snapshot: ProtocolSnapshot,
): Position {
  const holdings = snapshot.holdings[user] ?? {};
  const collateral = holdingsToCollateral(
    holdings,
    snapshot.prices,
    snapshot.assets,
  );
  const value = collateralValueUsd(collateral);
  const debt = snapshot.debts[user]?.total ?? 0;
  const weighted = weightedLiqUsd(collateral, snapshot.assets);
  return {
    user,
    collateral,
    collateralValueUsd: value,
    healthFactor: computeHf(weighted, debt),
    maxLtvBps: blendedBps(collateral, snapshot.assets, "maxLtvBps"),
    liquidationThresholdBps: blendedBps(
      collateral,
      snapshot.assets,
      "liquidationThresholdBps",
    ),
  };
}

export function listUsers(snapshot: ProtocolSnapshot): string[] {
  return [
    ...new Set([
      ...Object.keys(snapshot.holdings),
      ...Object.keys(snapshot.debts),
      ADDRESSES.you,
      ADDRESSES.whale,
      ADDRESSES.atRisk,
    ]),
  ];
}
