export type Address = string;

export type PriceData = {
  asset: Address;
  symbol: string;
  price: number;
  timestamp: number;
  writeTimestamp: number;
  fresh: boolean;
  stalenessThresholdSec: number;
};

export type CollateralAsset = {
  asset: Address;
  symbol: string;
  amount: number;
  valueUsd: number;
};

export type Position = {
  user: Address;
  collateral: CollateralAsset[];
  collateralValueUsd: number;
  healthFactor: number | "inf";
  maxLtvBps: number;
  liquidationThresholdBps: number;
};

export type Debt = {
  principal: number;
  accruedInterest: number;
  interestRateBps: number;
  lastAccrualAt: number;
  total: number;
};

export type AssetConfig = {
  symbol: string;
  name: string;
  asset: Address;
  type: string;
  tokenDecimals: number;
  oraclePriceDecimals: number;
  maxLtvBps: number;
  liquidationThresholdBps: number;
  supported: boolean;
};

export type LiquidationResult = {
  user: Address;
  repaid: number;
  seized: number;
  bonus: number;
};

export type PoolStats = {
  borrowAsset: "USDC";
  interestRateBps: number;
  totalSupply: number;
  totalBorrowed: number;
  availableLiquidity: number;
  utilizationBps: number;
  tvlUsd: number;
};

export type VaultPauseKey =
  | "deposit"
  | "borrow"
  | "withdraw"
  | "liquidation"
  | "recovery";

export type PoolPauseKey = "supply" | "borrow" | "repay" | "withdrawLiquidity";

export type PauseFlags = {
  vault: Record<VaultPauseKey, boolean>;
  pool: Record<PoolPauseKey, boolean>;
};

export type ProtocolEventType =
  | "Deposited"
  | "Withdrawn"
  | "CollateralSeized"
  | "AssetAdded"
  | "OperationPaused"
  | "Supplied"
  | "LiquidityWithdrawn"
  | "Borrowed"
  | "Repaid"
  | "Liquidated"
  | "PriceUpdated";

export type ProtocolEvent = {
  id: string;
  at: number;
  type: ProtocolEventType;
  module: "vault" | "pool" | "engine" | "oracle";
  user?: Address;
  asset?: string;
  amount?: number;
  interestPaid?: number;
  principalPaid?: number;
  repaid?: number;
  seized?: number;
  bonus?: number;
  txHash: string;
  status: "success" | "pending" | "failed";
  note?: string;
};

export type WalletBalances = Record<string, number>;

export type VaultHoldings = Record<string, number>;

export type AnalyticsPoint = {
  day: string;
  tvl: number;
  borrowed: number;
  utilization: number;
};

export type LiquidationStats = {
  volumeUsd: number;
  partialCount: number;
  fullCount: number;
  interestAccruedUsd: number;
};

export type ProtocolAnalytics = {
  history: AnalyticsPoint[];
  collateralPosted: Record<string, number>;
  liquidationStats: LiquidationStats;
};

/** Read model the UI renders. Both mock and HTTP adapters must return this shape. */
export type ProtocolSnapshot = {
  pause: PauseFlags;
  assets: AssetConfig[];
  prices: PriceData[];
  holdings: Record<string, VaultHoldings>;
  debts: Record<string, Debt>;
  supplies: Record<string, number>;
  wallets: Record<string, WalletBalances>;
  pool: PoolStats;
  events: ProtocolEvent[];
  oraclePaused: boolean;
  stalenessThresholdSec: number;
  feeders: string[];
  analytics: ProtocolAnalytics;
};

export type TxResult = { txHash: string };

export type RepayResult = TxResult & {
  interestPaid: number;
  principalPaid: number;
  repaid: number;
};

export type AccrueResult = TxResult & { accrued?: number };

export type LiquidateTxResult = LiquidationResult & TxResult;

export function emptySnapshot(): ProtocolSnapshot {
  return {
    pause: {
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
    },
    assets: [],
    prices: [],
    holdings: {},
    debts: {},
    supplies: {},
    wallets: {},
    pool: {
      borrowAsset: "USDC",
      interestRateBps: 0,
      totalSupply: 0,
      totalBorrowed: 0,
      availableLiquidity: 0,
      utilizationBps: 0,
      tvlUsd: 0,
    },
    events: [],
    oraclePaused: false,
    stalenessThresholdSec: 3600,
    feeders: [],
    analytics: {
      history: [],
      collateralPosted: {},
      liquidationStats: {
        volumeUsd: 0,
        partialCount: 0,
        fullCount: 0,
        interestAccruedUsd: 0,
      },
    },
  };
}
