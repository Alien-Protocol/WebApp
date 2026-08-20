import { ADDRESSES, BORROW_APR_BPS } from "@/lib/protocol/constants";
import { fakeTxHash } from "@/lib/format";
import type {
  AssetConfig,
  Debt,
  PauseFlags,
  PoolStats,
  PriceData,
  ProtocolEvent,
  ProtocolSnapshot,
  VaultHoldings,
  WalletBalances,
} from "@/lib/protocol/types";

const now = () => Math.floor(Date.now() / 1000);

export type SeedState = ProtocolSnapshot;

export function createSeed(): ProtocolSnapshot {
  const t = now();
  const staleThreshold = 3600;

  const assets: AssetConfig[] = [
    {
      symbol: "tBILL",
      name: "Treasury RWA",
      asset: ADDRESSES.tBILL,
      type: "Treasury RWA",
      tokenDecimals: 7,
      oraclePriceDecimals: 7,
      maxLtvBps: 7_000,
      liquidationThresholdBps: 8_000,
      supported: true,
    },
    {
      symbol: "tREIT",
      name: "Tokenized real estate",
      asset: ADDRESSES.tREIT,
      type: "Tokenized real estate",
      tokenDecimals: 7,
      oraclePriceDecimals: 7,
      maxLtvBps: 6_000,
      liquidationThresholdBps: 7_500,
      supported: true,
    },
    {
      symbol: "tINV",
      name: "Invoice / receivables",
      asset: ADDRESSES.tINV,
      type: "Invoice / receivables",
      tokenDecimals: 7,
      oraclePriceDecimals: 7,
      maxLtvBps: 5_000,
      liquidationThresholdBps: 6_500,
      supported: true,
    },
    {
      symbol: "XLM",
      name: "Stellar native",
      asset: ADDRESSES.xlm,
      type: "Native",
      tokenDecimals: 7,
      oraclePriceDecimals: 7,
      maxLtvBps: 5_000,
      liquidationThresholdBps: 6_500,
      supported: true,
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      asset: ADDRESSES.usdc,
      type: "Borrow / supply asset",
      tokenDecimals: 7,
      oraclePriceDecimals: 7,
      maxLtvBps: 0,
      liquidationThresholdBps: 0,
      supported: true,
    },
  ];

  const prices: PriceData[] = [
    {
      asset: ADDRESSES.tBILL,
      symbol: "tBILL",
      price: 1.002,
      timestamp: t - 42,
      writeTimestamp: t - 42,
      fresh: true,
      stalenessThresholdSec: staleThreshold,
    },
    {
      asset: ADDRESSES.tREIT,
      symbol: "tREIT",
      price: 24.5,
      timestamp: t - 95,
      writeTimestamp: t - 95,
      fresh: true,
      stalenessThresholdSec: staleThreshold,
    },
    {
      asset: ADDRESSES.tINV,
      symbol: "tINV",
      price: 0.98,
      timestamp: t - 14_400,
      writeTimestamp: t - 14_400,
      fresh: false,
      stalenessThresholdSec: staleThreshold,
    },
    {
      asset: ADDRESSES.xlm,
      symbol: "XLM",
      price: 0.42,
      timestamp: t - 18,
      writeTimestamp: t - 18,
      fresh: true,
      stalenessThresholdSec: staleThreshold,
    },
    {
      asset: ADDRESSES.usdc,
      symbol: "USDC",
      price: 1,
      timestamp: t - 12,
      writeTimestamp: t - 12,
      fresh: true,
      stalenessThresholdSec: staleThreshold,
    },
    {
      asset: ADDRESSES.eurc,
      symbol: "EURC",
      price: 1.084,
      timestamp: t - 220,
      writeTimestamp: t - 220,
      fresh: true,
      stalenessThresholdSec: staleThreshold,
    },
  ];

  const holdings: Record<string, VaultHoldings> = {
    [ADDRESSES.you]: { tBILL: 50_000, XLM: 25_000 },
    [ADDRESSES.whale]: { tBILL: 2_000_000 },
    [ADDRESSES.atRisk]: { tREIT: 8_000, tINV: 50_000 },
  };

  const lastAccrual = t - 2 * 86_400;

  const debts: Record<string, Debt> = {
    [ADDRESSES.you]: {
      principal: 28_400,
      accruedInterest: 553.7,
      interestRateBps: BORROW_APR_BPS,
      lastAccrualAt: lastAccrual,
      total: 28_953.7,
    },
    [ADDRESSES.whale]: {
      principal: 1_310_000,
      accruedInterest: 14_958.68,
      interestRateBps: BORROW_APR_BPS,
      lastAccrualAt: lastAccrual,
      total: 1_324_958.68,
    },
    [ADDRESSES.atRisk]: {
      principal: 187_400,
      accruedInterest: 2_865.96,
      interestRateBps: BORROW_APR_BPS,
      lastAccrualAt: lastAccrual,
      total: 190_265.96,
    },
  };

  const supplies: Record<string, number> = {
    [ADDRESSES.you]: 12_500,
    [ADDRESSES.whale]: 850_000,
  };

  const wallets: Record<string, WalletBalances> = {
    [ADDRESSES.you]: {
      USDC: 48_250,
      XLM: 4_180.22,
      tBILL: 2_400,
      tREIT: 85,
      tINV: 3_200,
    },
    [ADDRESSES.whale]: {
      USDC: 420_000,
      tBILL: 80_000,
    },
    [ADDRESSES.atRisk]: {
      USDC: 1_240,
      tREIT: 120,
      tINV: 4_000,
    },
  };

  const totalBorrowed = 28_953.7 + 1_324_958.68 + 190_265.96;
  const totalSupply = 2_450_000;
  const collateralTvl = 60_600 + 2_004_000 + 245_000;

  const pool: PoolStats = {
    borrowAsset: "USDC",
    interestRateBps: BORROW_APR_BPS,
    totalSupply,
    totalBorrowed,
    availableLiquidity: totalSupply - totalBorrowed,
    utilizationBps: Math.round((totalBorrowed / totalSupply) * 10_000),
    tvlUsd: collateralTvl + totalSupply,
  };

  const pause: PauseFlags = {
    vault: {
      deposit: false,
      borrow: false,
      withdraw: false,
      liquidation: false,
      recovery: false,
    },
    pool: {
      supply: false,
      borrow: false,
      repay: false,
      withdrawLiquidity: false,
    },
  };

  const events: ProtocolEvent[] = [
    ev("e01", t - 180, "PriceUpdated", "oracle", {
      asset: "tBILL",
      note: "Feeder tick",
    }),
    ev("e02", t - 420, "Borrowed", "pool", {
      user: ADDRESSES.you,
      asset: "USDC",
      amount: 4_200,
    }),
    ev("e03", t - 1_800, "Supplied", "pool", {
      user: ADDRESSES.you,
      asset: "USDC",
      amount: 2_500,
    }),
    ev("e04", t - 3_600, "Deposited", "vault", {
      user: ADDRESSES.you,
      asset: "XLM",
      amount: 5_000,
    }),
    ev("e05", t - 7_200, "Repaid", "pool", {
      user: ADDRESSES.you,
      asset: "USDC",
      amount: 1_200,
      interestPaid: 180.4,
      principalPaid: 1_019.6,
    }),
    ev("e06", t - 10_800, "Deposited", "vault", {
      user: ADDRESSES.you,
      asset: "tBILL",
      amount: 12_000,
    }),
    ev("e07", t - 14_400, "PriceUpdated", "oracle", {
      asset: "tINV",
      note: "Stale write — last accepted tick",
    }),
    ev("e08", t - 22_000, "Borrowed", "pool", {
      user: ADDRESSES.atRisk,
      asset: "USDC",
      amount: 42_000,
    }),
    ev("e09", t - 28_000, "Deposited", "vault", {
      user: ADDRESSES.atRisk,
      asset: "tINV",
      amount: 50_000,
    }),
    ev("e10", t - 36_000, "Deposited", "vault", {
      user: ADDRESSES.atRisk,
      asset: "tREIT",
      amount: 8_000,
    }),
    ev("e11", t - 48_000, "Borrowed", "pool", {
      user: ADDRESSES.whale,
      asset: "USDC",
      amount: 210_000,
    }),
    ev("e12", t - 55_000, "Supplied", "pool", {
      user: ADDRESSES.whale,
      asset: "USDC",
      amount: 250_000,
    }),
    ev("e13", t - 72_000, "Deposited", "vault", {
      user: ADDRESSES.whale,
      asset: "tBILL",
      amount: 400_000,
    }),
    ev("e14", t - 86_400, "Liquidated", "engine", {
      user: ADDRESSES.atRisk,
      asset: "tREIT",
      repaid: 18_400,
      seized: 19_872,
      bonus: 1_472,
      note: "Partial backstop (historical)",
    }),
    ev("e15", t - 92_000, "CollateralSeized", "vault", {
      user: ADDRESSES.atRisk,
      asset: "tREIT",
      amount: 811.1,
    }),
    ev("e16", t - 110_000, "LiquidityWithdrawn", "pool", {
      user: ADDRESSES.you,
      asset: "USDC",
      amount: 1_000,
    }),
    ev("e17", t - 140_000, "AssetAdded", "vault", {
      asset: "tINV",
      note: "Invoice receivables listed",
    }),
    ev("e18", t - 180_000, "OperationPaused", "vault", {
      note: "Vault deposit pause (resolved)",
    }),
  ];

  return {
    pause,
    assets,
    prices,
    holdings,
    debts,
    supplies,
    wallets,
    pool,
    events,
    oraclePaused: false,
    stalenessThresholdSec: staleThreshold,
    feeders: [ADDRESSES.feeder1, ADDRESSES.feeder2],
    analytics: {
      history: ANALYTICS_HISTORY,
      collateralPosted: COLLATERAL_POSTED,
      liquidationStats: LIQUIDATION_STATS,
    },
  };
}

function ev(
  id: string,
  at: number,
  type: ProtocolEvent["type"],
  module: ProtocolEvent["module"],
  extra: Partial<ProtocolEvent>,
): ProtocolEvent {
  return {
    id,
    at,
    type,
    module,
    txHash: fakeTxHash(id + String(at)),
    status: "success",
    ...extra,
  };
}

export const ANALYTICS_HISTORY = Array.from({ length: 14 }, (_, i) => {
  const day = 13 - i;
  const tvl = 4_120_000 + i * 48_000 + (i % 3) * 12_000;
  const borrowed = 1_280_000 + i * 19_500;
  const util = borrowed / (tvl * 0.52);
  return {
    day: `D-${day}`,
    tvl,
    borrowed,
    utilization: Math.min(0.72, util),
  };
});

export const COLLATERAL_POSTED: Record<string, number> = {
  tBILL: 2_054_600,
  tREIT: 196_000,
  tINV: 49_000,
  XLM: 10_500,
};

export const LIQUIDATION_STATS = {
  volumeUsd: 412_800,
  partialCount: 11,
  fullCount: 2,
  interestAccruedUsd: 86_420.44,
};
