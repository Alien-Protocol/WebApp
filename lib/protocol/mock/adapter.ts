"use client";

import { fakeTxHash } from "@/lib/format";
import type { ProtocolClient } from "@/lib/protocol/client";
import { BORROW_APR_BPS } from "@/lib/protocol/constants";
import { ProtocolError } from "@/lib/protocol/errors";
import {
  accrueDebt,
  applyRepay,
  borrowLimitRemaining,
  calculateBonusUsd,
  closeFactorMax,
  configOf,
  isWithdrawalSafeCalc,
  priceOf,
  repayToTargetHf,
  splitRepay,
  weightedLiqUsd,
} from "@/lib/protocol/math";
import {
  allUsers,
  derivePosition,
  getState,
  pushEvent,
  refreshPoolDerived,
  resetState,
  setState,
  subscribe,
} from "@/lib/protocol/mock/store";
import type {
  AssetConfig,
  Debt,
  LiquidateTxResult,
  PoolPauseKey,
  Position,
  PriceData,
  VaultPauseKey,
} from "@/lib/protocol/types";

function wait(): Promise<void> {
  const ms = 400 + Math.floor(Math.random() * 500);
  return new Promise((r) => setTimeout(r, ms));
}

async function run<T>(fn: () => T): Promise<T> {
  await wait();
  return fn();
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function requireAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ProtocolError("Invalid amount");
  }
}

function requireVaultOp(op: VaultPauseKey) {
  if (getState().pause.vault[op]) {
    throw new ProtocolError(`Vault paused: ${op}`);
  }
}

function requirePoolOp(op: PoolPauseKey) {
  if (getState().pause.pool[op]) {
    throw new ProtocolError(`Pool paused: ${op}`);
  }
}

function walletOf(user: string, symbol: string): number {
  return getState().wallets[user]?.[symbol] ?? 0;
}

function creditWallet(user: string, symbol: string, amount: number) {
  setState((s) => ({
    ...s,
    wallets: {
      ...s.wallets,
      [user]: {
        ...(s.wallets[user] ?? {}),
        [symbol]: (s.wallets[user]?.[symbol] ?? 0) + amount,
      },
    },
  }));
}

function debitWallet(user: string, symbol: string, amount: number) {
  if (walletOf(user, symbol) + 1e-9 < amount) {
    throw new ProtocolError("Insufficient wallet balance");
  }
  creditWallet(user, symbol, -amount);
}

function emit(
  type: Parameters<typeof pushEvent>[0]["type"],
  module: Parameters<typeof pushEvent>[0]["module"],
  extra: Partial<Parameters<typeof pushEvent>[0]>,
) {
  const txHash = fakeTxHash(`${type}-${Date.now()}-${Math.random()}`);
  pushEvent({
    type,
    module,
    at: nowSec(),
    txHash,
    ...extra,
  });
  return txHash;
}

export const vault = {
  deposit(user: string, symbol: string, amount: number) {
    return run(() => {
      requireVaultOp("deposit");
      requireAmount(amount);
      const cfg = configOf(symbol, getState().assets);
      if (!cfg?.supported || symbol === "USDC") {
        throw new ProtocolError("Asset not supported");
      }
      debitWallet(user, symbol, amount);
      setState((s) => ({
        ...s,
        holdings: {
          ...s.holdings,
          [user]: {
            ...(s.holdings[user] ?? {}),
            [symbol]: (s.holdings[user]?.[symbol] ?? 0) + amount,
          },
        },
      }));
      setState((s) => refreshPoolDerived(s));
      const txHash = emit("Deposited", "vault", { user, asset: symbol, amount });
      return { txHash };
    });
  },

  withdraw(user: string, symbol: string, amount: number) {
    return run(() => {
      requireVaultOp("withdraw");
      requireAmount(amount);
      const held = getState().holdings[user]?.[symbol] ?? 0;
      if (amount > held + 1e-9) {
        throw new ProtocolError("Invalid amount");
      }
      const s = getState();
      const debt = s.debts[user]?.total ?? 0;
      if (
        !isWithdrawalSafeCalc(
          s.holdings[user] ?? {},
          symbol,
          amount,
          debt,
          s.prices,
          s.assets,
        )
      ) {
        throw new ProtocolError("Below min collateral ratio");
      }
      setState((st) => ({
        ...st,
        holdings: {
          ...st.holdings,
          [user]: {
            ...(st.holdings[user] ?? {}),
            [symbol]: held - amount,
          },
        },
      }));
      creditWallet(user, symbol, amount);
      setState((st) => refreshPoolDerived(st));
      const txHash = emit("Withdrawn", "vault", { user, asset: symbol, amount });
      return { txHash };
    });
  },

  getPosition(user: string): Promise<Position> {
    return run(() => derivePosition(user));
  },

  getAllPositions(): Promise<Position[]> {
    return run(() => allUsers().map((u) => derivePosition(u)));
  },

  getCollateralValue(user: string): Promise<number> {
    return run(() => derivePosition(user).collateralValueUsd);
  },

  getHealthFactor(user: string): Promise<number | "inf"> {
    return run(() => derivePosition(user).healthFactor);
  },

  isWithdrawalSafe(user: string, symbol: string, amount: number): Promise<boolean> {
    return run(() => {
      const s = getState();
      return isWithdrawalSafeCalc(
        s.holdings[user] ?? {},
        symbol,
        amount,
        s.debts[user]?.total ?? 0,
        s.prices,
        s.assets,
      );
    });
  },

  getAssetConfig(symbol: string): Promise<AssetConfig | undefined> {
    return run(() => configOf(symbol, getState().assets));
  },

  isSupportedAsset(symbol: string): Promise<boolean> {
    return run(() => Boolean(configOf(symbol, getState().assets)?.supported));
  },
};

export const pool = {
  supply(user: string, amount: number) {
    return run(() => {
      requirePoolOp("supply");
      requireAmount(amount);
      debitWallet(user, "USDC", amount);
      setState((s) =>
        refreshPoolDerived({
          ...s,
          supplies: {
            ...s.supplies,
            [user]: (s.supplies[user] ?? 0) + amount,
          },
          pool: {
            ...s.pool,
            totalSupply: s.pool.totalSupply + amount,
          },
        }),
      );
      const txHash = emit("Supplied", "pool", {
        user,
        asset: "USDC",
        amount,
      });
      return { txHash };
    });
  },

  withdrawLiquidity(user: string, amount: number) {
    return run(() => {
      requirePoolOp("withdrawLiquidity");
      requireAmount(amount);
      const s = getState();
      const supplied = s.supplies[user] ?? 0;
      if (amount > supplied + 1e-9) {
        throw new ProtocolError("Insufficient supply");
      }
      if (amount > s.pool.availableLiquidity + 1e-9) {
        throw new ProtocolError("Insufficient liquidity");
      }
      setState((st) =>
        refreshPoolDerived({
          ...st,
          supplies: {
            ...st.supplies,
            [user]: supplied - amount,
          },
          pool: {
            ...st.pool,
            totalSupply: st.pool.totalSupply - amount,
          },
        }),
      );
      creditWallet(user, "USDC", amount);
      const txHash = emit("LiquidityWithdrawn", "pool", {
        user,
        asset: "USDC",
        amount,
      });
      return { txHash };
    });
  },

  getUserSupply(user: string): Promise<number> {
    return run(() => getState().supplies[user] ?? 0);
  },

  getTotalSupply(): Promise<number> {
    return run(() => getState().pool.totalSupply);
  },

  getAvailableLiquidity(): Promise<number> {
    return run(() => getState().pool.availableLiquidity);
  },

  getUtilizationBps(): Promise<number> {
    return run(() => getState().pool.utilizationBps);
  },

  borrow(user: string, _asset: "USDC", amount: number) {
    return run(() => {
      requirePoolOp("borrow");
      requireVaultOp("borrow");
      requireAmount(amount);
      const s = getState();
      if (amount > s.pool.availableLiquidity + 1e-9) {
        throw new ProtocolError("Insufficient liquidity");
      }
      const pos = derivePosition(user, s);
      const stale = pos.collateral.some((c) => {
        const p = priceOf(c.symbol, s.prices);
        return p && !p.fresh;
      });
      const usdc = priceOf("USDC", s.prices);
      if (stale || (usdc && !usdc.fresh) || s.oraclePaused) {
        throw new ProtocolError("Oracle feed stale");
      }
      const limit = borrowLimitRemaining(
        pos.collateral,
        s.assets,
        s.debts[user]?.total ?? 0,
      );
      if (amount > limit + 1e-6) {
        throw new ProtocolError("Exceeds borrow limit");
      }
      const existing = s.debts[user] ?? {
        principal: 0,
        accruedInterest: 0,
        interestRateBps: BORROW_APR_BPS,
        lastAccrualAt: nowSec(),
        total: 0,
      };
      const accrued = accrueDebt(existing, nowSec());
      const next: Debt = {
        ...accrued,
        principal: accrued.principal + amount,
        total: accrued.principal + amount + accrued.accruedInterest,
      };
      setState((st) =>
        refreshPoolDerived({
          ...st,
          debts: { ...st.debts, [user]: next },
          pool: {
            ...st.pool,
            totalBorrowed: st.pool.totalBorrowed + amount,
          },
        }),
      );
      creditWallet(user, "USDC", amount);
      const txHash = emit("Borrowed", "pool", {
        user,
        asset: "USDC",
        amount,
      });
      return { txHash };
    });
  },

  repay(user: string, amount: number) {
    return repayFor(user, user, amount);
  },

  repayFor(payer: string, user: string, amount: number) {
    return repayFor(payer, user, amount);
  },

  getDebt(user: string): Promise<Debt> {
    return run(
      () =>
        getState().debts[user] ?? {
          principal: 0,
          accruedInterest: 0,
          interestRateBps: BORROW_APR_BPS,
          lastAccrualAt: nowSec(),
          total: 0,
        },
    );
  },

  accrueInterest(user: string) {
    return run(() => {
      const existing = getState().debts[user];
      if (!existing) {
        return { txHash: fakeTxHash("accrue-empty") };
      }
      const next = accrueDebt(existing, nowSec());
      const extra = next.total - existing.total;
      setState((s) =>
        refreshPoolDerived({
          ...s,
          debts: { ...s.debts, [user]: next },
          pool: {
            ...s.pool,
            totalBorrowed: s.pool.totalBorrowed + extra,
          },
        }),
      );
      const txHash = fakeTxHash(`accrue-${user}-${nowSec()}`);
      return { txHash, accrued: extra };
    });
  },

  calculateLimit(user: string): Promise<number> {
    return run(() => {
      const s = getState();
      const pos = derivePosition(user, s);
      return borrowLimitRemaining(
        pos.collateral,
        s.assets,
        s.debts[user]?.total ?? 0,
      );
    });
  },

  isLiquidatable(user: string): Promise<boolean> {
    return run(() => {
      const hf = derivePosition(user).healthFactor;
      return hf !== "inf" && hf < 1;
    });
  },
};

function repayFor(payer: string, user: string, amount: number) {
  return run(() => {
    requirePoolOp("repay");
    requireAmount(amount);
    const s = getState();
    const debt = s.debts[user];
    if (!debt || debt.total <= 0) {
      throw new ProtocolError("Invalid amount");
    }
    const pay = Math.min(amount, debt.total);
    debitWallet(payer, "USDC", pay);
    const split = splitRepay(pay, debt);
    const next = applyRepay(debt, pay);
    setState((st) =>
      refreshPoolDerived({
        ...st,
        debts: { ...st.debts, [user]: next },
        pool: {
          ...st.pool,
          totalBorrowed: Math.max(0, st.pool.totalBorrowed - pay),
        },
      }),
    );
    const txHash = emit("Repaid", "pool", {
      user,
      asset: "USDC",
      amount: pay,
      interestPaid: split.interestPaid,
      principalPaid: split.principalPaid,
      note: payer !== user ? `Payer ${payer.slice(0, 4)}…` : undefined,
    });
    return { txHash, ...split, repaid: pay };
  });
}

export const oracle = {
  getPrice(symbol: string): Promise<PriceData | undefined> {
    return run(() => priceOf(symbol, getState().prices));
  },

  isPriceFresh(symbol: string): Promise<boolean> {
    return run(() => Boolean(priceOf(symbol, getState().prices)?.fresh));
  },

  getStalenessThreshold(): Promise<number> {
    return run(() => getState().stalenessThresholdSec);
  },
};

export const engine = {
  isLiquidatable(user: string): Promise<boolean> {
    return pool.isLiquidatable(user);
  },

  calculateBonus(repayUsd: number): Promise<number> {
    return run(() => calculateBonusUsd(repayUsd));
  },

  calculatePartialRepayment(user: string): Promise<number> {
    return run(() => {
      const s = getState();
      const pos = derivePosition(user, s);
      const debt = s.debts[user]?.total ?? 0;
      if (debt <= 0) return 0;
      const thresh =
        pos.collateralValueUsd > 0
          ? weightedLiqUsd(pos.collateral, s.assets) / pos.collateralValueUsd
          : 0;
      const needed = repayToTargetHf(
        pos.collateralValueUsd,
        thresh,
        debt,
      );
      return Math.min(needed, closeFactorMax(debt));
    });
  },

  liquidate(
    liquidator: string,
    user: string,
    repayUsd: number,
  ): Promise<LiquidateTxResult> {
    return run(() => {
      requireVaultOp("liquidation");
      requireAmount(repayUsd);
      const s = getState();
      const pos = derivePosition(user, s);
      const hf = pos.healthFactor;
      if (hf === "inf" || hf >= 1) {
        throw new ProtocolError("Not liquidatable");
      }
      const debt = s.debts[user];
      if (!debt) throw new ProtocolError("Not liquidatable");
      const maxRepay = closeFactorMax(debt.total);
      const pay = Math.min(repayUsd, maxRepay, debt.total);
      debitWallet(liquidator, "USDC", pay);
      const bonus = calculateBonusUsd(pay);
      const seizeUsd = pay + bonus;
      const sorted = [...pos.collateral].sort((a, b) => b.valueUsd - a.valueUsd);
      let remaining = seizeUsd;
      const holdings = { ...(s.holdings[user] ?? {}) };
      let seizedAmount = 0;
      let seizedSymbol = sorted[0]?.symbol ?? "tBILL";
      for (const c of sorted) {
        if (remaining <= 0) break;
        const px = priceOf(c.symbol, s.prices)?.price ?? 0;
        if (px <= 0) continue;
        const takeUsd = Math.min(remaining, c.valueUsd);
        const takeAmt = takeUsd / px;
        holdings[c.symbol] = Math.max(0, (holdings[c.symbol] ?? 0) - takeAmt);
        creditWallet(liquidator, c.symbol, takeAmt);
        remaining -= takeUsd;
        seizedAmount += takeAmt;
        seizedSymbol = c.symbol;
      }
      const next = applyRepay(debt, pay);
      setState((st) =>
        refreshPoolDerived({
          ...st,
          holdings: { ...st.holdings, [user]: holdings },
          debts: { ...st.debts, [user]: next },
          pool: {
            ...st.pool,
            totalBorrowed: Math.max(0, st.pool.totalBorrowed - pay),
          },
        }),
      );
      const txHash = emit("Liquidated", "engine", {
        user,
        asset: seizedSymbol,
        repaid: pay,
        seized: seizeUsd,
        bonus,
        amount: seizedAmount,
      });
      emit("CollateralSeized", "vault", {
        user,
        asset: seizedSymbol,
        amount: seizedAmount,
      });
      return {
        user,
        repaid: pay,
        seized: seizeUsd,
        bonus,
        txHash,
      };
    });
  },
};

export const admin = {
  setVaultPause(op: VaultPauseKey, paused: boolean) {
    setState((s) => ({
      ...s,
      pause: { ...s.pause, vault: { ...s.pause.vault, [op]: paused } },
    }));
    if (paused) {
      emit("OperationPaused", "vault", { note: `Vault ${op}` });
    }
    return Promise.resolve();
  },

  setPoolPause(op: PoolPauseKey, paused: boolean) {
    setState((s) => ({
      ...s,
      pause: { ...s.pause, pool: { ...s.pause.pool, [op]: paused } },
    }));
    if (paused) {
      emit("OperationPaused", "pool", { note: `Pool ${op}` });
    }
    return Promise.resolve();
  },

  setAssetSupported(symbol: string, supported: boolean) {
    setState((s) => ({
      ...s,
      assets: s.assets.map((a) =>
        a.symbol === symbol ? { ...a, supported } : a,
      ),
    }));
    if (supported) {
      emit("AssetAdded", "vault", { asset: symbol });
    }
    return Promise.resolve();
  },

  updateAssetConfig(
    symbol: string,
    patch: Partial<Pick<AssetConfig, "tokenDecimals" | "maxLtvBps" | "liquidationThresholdBps" | "oraclePriceDecimals">>,
  ) {
    setState((s) => ({
      ...s,
      assets: s.assets.map((a) =>
        a.symbol === symbol ? { ...a, ...patch } : a,
      ),
    }));
    return Promise.resolve();
  },

  setOraclePaused(paused: boolean) {
    setState((s) => ({ ...s, oraclePaused: paused }));
    if (paused) emit("OperationPaused", "oracle", { note: "Oracle updates" });
    return Promise.resolve();
  },

  setStalenessThreshold(sec: number) {
    setState((s) => ({
      ...s,
      stalenessThresholdSec: sec,
      prices: s.prices.map((p) => ({ ...p, stalenessThresholdSec: sec })),
    }));
    return Promise.resolve();
  },

  markPriceStale(symbol: string, stale: boolean) {
    const t = nowSec();
    setState((s) => ({
      ...s,
      prices: s.prices.map((p) =>
        p.symbol === symbol
          ? {
              ...p,
              fresh: !stale,
              timestamp: stale ? t - s.stalenessThresholdSec - 60 : t,
              writeTimestamp: stale ? t - s.stalenessThresholdSec - 60 : t,
            }
          : p,
      ),
    }));
    emit("PriceUpdated", "oracle", {
      asset: symbol,
      note: stale ? "Marked stale" : "Refreshed",
    });
    return Promise.resolve();
  },

  setFeeders(feeders: string[]) {
    setState((s) => ({ ...s, feeders }));
    return Promise.resolve();
  },
};

export function createMockClient(): ProtocolClient {
  return {
    mode: "mock",
    getSnapshot: getState,
    subscribe,
    reset: resetState,
    vault,
    pool,
    oracle,
    engine,
    admin,
  };
}
