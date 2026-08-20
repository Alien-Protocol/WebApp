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

export type ProtocolErrorCode =
  | "Invalid amount"
  | "Insufficient supply"
  | "Insufficient liquidity"
  | "Exceeds borrow limit"
  | "Below min collateral ratio"
  | "Not liquidatable"
  | "Insufficient wallet balance"
  | "Asset not supported"
  | "Oracle feed stale";

export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProtocolError";
  }
}
