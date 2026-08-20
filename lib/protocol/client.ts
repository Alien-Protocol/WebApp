import type { DataSource } from "@/lib/config";
import type {
  AccrueResult,
  AssetConfig,
  Debt,
  LiquidateTxResult,
  PoolPauseKey,
  Position,
  PriceData,
  ProtocolSnapshot,
  RepayResult,
  TxResult,
  VaultPauseKey,
} from "@/lib/protocol/types";

export type VaultApi = {
  deposit(user: string, symbol: string, amount: number): Promise<TxResult>;
  withdraw(user: string, symbol: string, amount: number): Promise<TxResult>;
  getPosition(user: string): Promise<Position>;
  getAllPositions(): Promise<Position[]>;
  getCollateralValue(user: string): Promise<number>;
  getHealthFactor(user: string): Promise<number | "inf">;
  isWithdrawalSafe(user: string, symbol: string, amount: number): Promise<boolean>;
  getAssetConfig(symbol: string): Promise<AssetConfig | undefined>;
  isSupportedAsset(symbol: string): Promise<boolean>;
};

export type PoolApi = {
  supply(user: string, amount: number): Promise<TxResult>;
  withdrawLiquidity(user: string, amount: number): Promise<TxResult>;
  getUserSupply(user: string): Promise<number>;
  getTotalSupply(): Promise<number>;
  getAvailableLiquidity(): Promise<number>;
  getUtilizationBps(): Promise<number>;
  borrow(user: string, asset: "USDC", amount: number): Promise<TxResult>;
  repay(user: string, amount: number): Promise<RepayResult>;
  repayFor(payer: string, user: string, amount: number): Promise<RepayResult>;
  getDebt(user: string): Promise<Debt>;
  accrueInterest(user: string): Promise<AccrueResult>;
  calculateLimit(user: string): Promise<number>;
  isLiquidatable(user: string): Promise<boolean>;
};

export type OracleApi = {
  getPrice(symbol: string): Promise<PriceData | undefined>;
  isPriceFresh(symbol: string): Promise<boolean>;
  getStalenessThreshold(): Promise<number>;
};

export type EngineApi = {
  isLiquidatable(user: string): Promise<boolean>;
  calculateBonus(repayUsd: number): Promise<number>;
  calculatePartialRepayment(user: string): Promise<number>;
  liquidate(
    liquidator: string,
    user: string,
    repayUsd: number,
  ): Promise<LiquidateTxResult>;
};

export type AdminApi = {
  setVaultPause(op: VaultPauseKey, paused: boolean): Promise<void>;
  setPoolPause(op: PoolPauseKey, paused: boolean): Promise<void>;
  setAssetSupported(symbol: string, supported: boolean): Promise<void>;
  updateAssetConfig(
    symbol: string,
    patch: Partial<
      Pick<
        AssetConfig,
        "tokenDecimals" | "maxLtvBps" | "liquidationThresholdBps" | "oraclePriceDecimals"
      >
    >,
  ): Promise<void>;
  setOraclePaused(paused: boolean): Promise<void>;
  setStalenessThreshold(sec: number): Promise<void>;
  markPriceStale(symbol: string, stale: boolean): Promise<void>;
  setFeeders(feeders: string[]): Promise<void>;
};

/**
 * Single seam between UI and data.
 * Mock implements this in-memory; HTTP implements the same methods against REST.
 */
export type ProtocolClient = {
  mode: DataSource;
  getSnapshot(): ProtocolSnapshot;
  subscribe(listener: () => void): () => void;
  reset(): void;
  vault: VaultApi;
  pool: PoolApi;
  oracle: OracleApi;
  engine: EngineApi;
  admin: AdminApi;
};
