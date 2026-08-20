import {
  BPS_DENOM,
  CLOSE_FACTOR_BPS,
  HF_SAFE,
  HF_VERY_SAFE,
  LIQUIDATION_BONUS_BPS,
  MIN_COLLATERAL_RATIO,
  SECONDS_PER_YEAR,
  TARGET_HF_AFTER_LIQ_BPS,
} from "@/lib/mock/constants";
import type {
  AssetConfig,
  CollateralAsset,
  Debt,
  PriceData,
  VaultHoldings,
} from "@/lib/mock/types";

export type HealthBand = "very-safe" | "safe" | "liquidatable" | "none";

export function healthBand(hf: number | "inf"): HealthBand {
  if (hf === "inf") return "very-safe";
  if (hf > HF_VERY_SAFE) return "very-safe";
  if (hf >= HF_SAFE) return "safe";
  return "liquidatable";
}

export function healthLabel(hf: number | "inf"): string {
  const band = healthBand(hf);
  if (band === "very-safe") return "Very Safe";
  if (band === "safe") return "Safe";
  return "Liquidatable";
}

export function computeHf(
  weightedLiqUsd: number,
  debt: number,
): number | "inf" {
  if (debt <= 0) return "inf";
  return weightedLiqUsd / debt;
}

export function priceOf(
  symbol: string,
  prices: PriceData[],
): PriceData | undefined {
  return prices.find((p) => p.symbol === symbol);
}

export function configOf(
  symbol: string,
  configs: AssetConfig[],
): AssetConfig | undefined {
  return configs.find((c) => c.symbol === symbol);
}

export function holdingsToCollateral(
  holdings: VaultHoldings,
  prices: PriceData[],
  configs: AssetConfig[],
): CollateralAsset[] {
  return Object.entries(holdings)
    .filter(([, amount]) => amount > 0)
    .map(([symbol, amount]) => {
      const px = priceOf(symbol, prices);
      const cfg = configOf(symbol, configs);
      return {
        asset: cfg?.asset ?? "",
        symbol,
        amount,
        valueUsd: amount * (px?.price ?? 0),
      };
    });
}

export function weightedLiqUsd(
  collateral: CollateralAsset[],
  configs: AssetConfig[],
): number {
  return collateral.reduce((sum, c) => {
    const cfg = configOf(c.symbol, configs);
    const t = (cfg?.liquidationThresholdBps ?? 0) / BPS_DENOM;
    return sum + c.valueUsd * t;
  }, 0);
}

export function weightedMaxBorrowUsd(
  collateral: CollateralAsset[],
  configs: AssetConfig[],
): number {
  return collateral.reduce((sum, c) => {
    const cfg = configOf(c.symbol, configs);
    const t = (cfg?.maxLtvBps ?? 0) / BPS_DENOM;
    return sum + c.valueUsd * t;
  }, 0);
}

export function blendedBps(
  collateral: CollateralAsset[],
  configs: AssetConfig[],
  key: "maxLtvBps" | "liquidationThresholdBps",
): number {
  const total = collateral.reduce((s, c) => s + c.valueUsd, 0);
  if (total <= 0) return 0;
  const weighted = collateral.reduce((sum, c) => {
    const cfg = configOf(c.symbol, configs);
    return sum + c.valueUsd * (cfg?.[key] ?? 0);
  }, 0);
  return Math.round(weighted / total);
}

export function collateralValueUsd(collateral: CollateralAsset[]): number {
  return collateral.reduce((s, c) => s + c.valueUsd, 0);
}

export function simulateWithdraw(
  holdings: VaultHoldings,
  symbol: string,
  amount: number,
): VaultHoldings {
  return {
    ...holdings,
    [symbol]: Math.max(0, (holdings[symbol] ?? 0) - amount),
  };
}

export function isWithdrawalSafeCalc(
  holdings: VaultHoldings,
  symbol: string,
  amount: number,
  debtTotal: number,
  prices: PriceData[],
  configs: AssetConfig[],
): boolean {
  if (debtTotal <= 0) return true;
  const next = holdingsToCollateral(
    simulateWithdraw(holdings, symbol, amount),
    prices,
    configs,
  );
  return collateralValueUsd(next) >= debtTotal * MIN_COLLATERAL_RATIO;
}

export function borrowLimitRemaining(
  collateral: CollateralAsset[],
  configs: AssetConfig[],
  debtTotal: number,
): number {
  return Math.max(0, weightedMaxBorrowUsd(collateral, configs) - debtTotal);
}

export function ltvPct(collateralUsd: number, debt: number): number {
  if (collateralUsd <= 0) return debt > 0 ? 999 : 0;
  return (debt / collateralUsd) * 100;
}

export function accrueDebt(debt: Debt, nowSec: number): Debt {
  const dt = Math.max(0, nowSec - debt.lastAccrualAt);
  const extra =
    debt.principal *
    (debt.interestRateBps / BPS_DENOM) *
    (dt / SECONDS_PER_YEAR);
  const accruedInterest = debt.accruedInterest + extra;
  return {
    ...debt,
    accruedInterest,
    lastAccrualAt: nowSec,
    total: debt.principal + accruedInterest,
  };
}

export function splitRepay(
  amount: number,
  debt: Debt,
): { interestPaid: number; principalPaid: number } {
  const interestPaid = Math.min(amount, debt.accruedInterest);
  const principalPaid = Math.min(
    amount - interestPaid,
    debt.principal,
  );
  return { interestPaid, principalPaid };
}

export function applyRepay(debt: Debt, amount: number): Debt {
  const { interestPaid, principalPaid } = splitRepay(amount, debt);
  const accruedInterest = debt.accruedInterest - interestPaid;
  const principal = debt.principal - principalPaid;
  return {
    ...debt,
    accruedInterest,
    principal,
    total: principal + accruedInterest,
  };
}

export function calculateBonusUsd(repayUsd: number): number {
  return repayUsd * (LIQUIDATION_BONUS_BPS / BPS_DENOM);
}

export function closeFactorMax(debtTotal: number): number {
  return debtTotal * (CLOSE_FACTOR_BPS / BPS_DENOM);
}

/** Repay needed to reach target HF 1.10, uncapped. */
export function repayToTargetHf(
  collateralUsd: number,
  weightedThreshold: number,
  debt: number,
): number {
  if (debt <= 0) return 0;
  const target = TARGET_HF_AFTER_LIQ_BPS / BPS_DENOM;
  const bonusMult = 1 + LIQUIDATION_BONUS_BPS / BPS_DENOM;
  const denom = target - bonusMult * weightedThreshold;
  if (denom <= 0) return closeFactorMax(debt);
  const repay = (target * debt - collateralUsd * weightedThreshold) / denom;
  return Math.max(0, repay);
}

export function previewHfAfterBorrow(
  weightedLiq: number,
  debt: number,
  extraBorrow: number,
): number | "inf" {
  return computeHf(weightedLiq, debt + extraBorrow);
}

export function previewHfAfterRepay(
  weightedLiq: number,
  debt: number,
  repay: number,
): number | "inf" {
  return computeHf(weightedLiq, Math.max(0, debt - repay));
}

export function utilizationBps(borrowed: number, supply: number): number {
  if (supply <= 0) return 0;
  return Math.round((borrowed / supply) * BPS_DENOM);
}

export function supplierApyPct(utilizationBpsValue: number, borrowAprBps: number): number {
  const u = utilizationBpsValue / BPS_DENOM;
  return (borrowAprBps / 100) * u * 0.9;
}
