"use client";

import type {
  AdminApi,
  EngineApi,
  OracleApi,
  PoolApi,
  ProtocolClient,
  VaultApi,
} from "@/lib/protocol/client";
import { ProtocolError } from "@/lib/protocol/errors";
import {
  emptySnapshot,
  type AccrueResult,
  type AssetConfig,
  type Debt,
  type LiquidateTxResult,
  type Position,
  type PriceData,
  type ProtocolSnapshot,
  type RepayResult,
  type TxResult,
} from "@/lib/protocol/types";

type HttpClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  pollIntervalMs: number;
};

type ErrorBody = { error?: string; message?: string };

/**
 * REST contract expected by this adapter. Point NEXT_PUBLIC_API_BASE_URL at a
 * backend that implements these routes and the UI does not need to change.
 *
 * GET    /v1/state
 * POST   /v1/vault/deposit              { user, symbol, amount }
 * POST   /v1/vault/withdraw             { user, symbol, amount }
 * GET    /v1/vault/positions
 * GET    /v1/vault/positions/:user
 * GET    /v1/vault/assets/:symbol
 * POST   /v1/pool/supply                { user, amount }
 * POST   /v1/pool/withdraw              { user, amount }
 * POST   /v1/pool/borrow                { user, asset, amount }
 * POST   /v1/pool/repay                 { user, amount }
 * POST   /v1/pool/repay-for             { payer, user, amount }
 * POST   /v1/pool/accrue                { user }
 * GET    /v1/pool/supply/:user
 * GET    /v1/pool/debt/:user
 * GET    /v1/pool/limit/:user
 * GET    /v1/oracle/prices/:symbol
 * GET    /v1/oracle/staleness
 * POST   /v1/engine/liquidate           { liquidator, user, repayUsd }
 * GET    /v1/engine/bonus?repayUsd=
 * GET    /v1/engine/partial-repay/:user
 * POST   /v1/admin/vault/pause          { op, paused }
 * POST   /v1/admin/pool/pause           { op, paused }
 * POST   /v1/admin/assets/:symbol       { supported?, tokenDecimals?, ... }
 * POST   /v1/admin/oracle               { paused?, stalenessThresholdSec?, feeders? }
 * POST   /v1/admin/oracle/prices/:symbol { stale }
 */
export function createHttpClient(opts: HttpClientOptions): ProtocolClient {
  let snapshot = emptySnapshot();
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    try {
      const res = await fetch(`${opts.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
        signal: controller.signal,
      });
      const text = await res.text();
      const body = text ? (JSON.parse(text) as T | ErrorBody) : ({} as T);
      if (!res.ok) {
        const err = body as ErrorBody;
        throw new ProtocolError(err.error ?? err.message ?? `Request failed (${res.status})`, {
          status: res.status,
        });
      }
      return body as T;
    } catch (err) {
      if (err instanceof ProtocolError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new ProtocolError("Network error", { code: "Network error" });
      }
      throw new ProtocolError(
        err instanceof Error ? err.message : "Network error",
        { code: "Network error" },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  function get<T>(path: string) {
    return request<T>(path);
  }

  function post<T>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function refresh() {
    snapshot = await get<ProtocolSnapshot>("/v1/state");
    emit();
  }

  async function mutate<T>(path: string, body?: unknown): Promise<T> {
    const result = await post<T>(path, body);
    await refresh();
    return result;
  }

  const vault: VaultApi = {
    deposit: (user, symbol, amount) =>
      mutate<TxResult>("/v1/vault/deposit", { user, symbol, amount }),
    withdraw: (user, symbol, amount) =>
      mutate<TxResult>("/v1/vault/withdraw", { user, symbol, amount }),
    getPosition: (user) =>
      get<Position>(`/v1/vault/positions/${encodeURIComponent(user)}`),
    getAllPositions: () => get<Position[]>("/v1/vault/positions"),
    getCollateralValue: async (user) =>
      (await vault.getPosition(user)).collateralValueUsd,
    getHealthFactor: async (user) => (await vault.getPosition(user)).healthFactor,
    isWithdrawalSafe: (user, symbol, amount) =>
      get<boolean>(
        `/v1/vault/withdraw-safe?user=${encodeURIComponent(user)}&symbol=${encodeURIComponent(symbol)}&amount=${amount}`,
      ),
    getAssetConfig: (symbol) =>
      get<AssetConfig | undefined>(`/v1/vault/assets/${encodeURIComponent(symbol)}`),
    isSupportedAsset: async (symbol) =>
      Boolean((await vault.getAssetConfig(symbol))?.supported),
  };

  const pool: PoolApi = {
    supply: (user, amount) => mutate<TxResult>("/v1/pool/supply", { user, amount }),
    withdrawLiquidity: (user, amount) =>
      mutate<TxResult>("/v1/pool/withdraw", { user, amount }),
    getUserSupply: (user) => get<number>(`/v1/pool/supply/${encodeURIComponent(user)}`),
    getTotalSupply: async () => snapshot.pool.totalSupply,
    getAvailableLiquidity: async () => snapshot.pool.availableLiquidity,
    getUtilizationBps: async () => snapshot.pool.utilizationBps,
    borrow: (user, asset, amount) =>
      mutate<TxResult>("/v1/pool/borrow", { user, asset, amount }),
    repay: (user, amount) => mutate<RepayResult>("/v1/pool/repay", { user, amount }),
    repayFor: (payer, user, amount) =>
      mutate<RepayResult>("/v1/pool/repay-for", { payer, user, amount }),
    getDebt: (user) => get<Debt>(`/v1/pool/debt/${encodeURIComponent(user)}`),
    accrueInterest: (user) => mutate<AccrueResult>("/v1/pool/accrue", { user }),
    calculateLimit: (user) => get<number>(`/v1/pool/limit/${encodeURIComponent(user)}`),
    isLiquidatable: async (user) => {
      const hf = (await vault.getPosition(user)).healthFactor;
      return hf !== "inf" && hf < 1;
    },
  };

  const oracle: OracleApi = {
    getPrice: (symbol) =>
      get<PriceData | undefined>(`/v1/oracle/prices/${encodeURIComponent(symbol)}`),
    isPriceFresh: async (symbol) =>
      Boolean((await oracle.getPrice(symbol))?.fresh),
    getStalenessThreshold: () => get<number>("/v1/oracle/staleness"),
  };

  const engine: EngineApi = {
    isLiquidatable: (user) => pool.isLiquidatable(user),
    calculateBonus: (repayUsd) => get<number>(`/v1/engine/bonus?repayUsd=${repayUsd}`),
    calculatePartialRepayment: (user) =>
      get<number>(`/v1/engine/partial-repay/${encodeURIComponent(user)}`),
    liquidate: (liquidator, user, repayUsd) =>
      mutate<LiquidateTxResult>("/v1/engine/liquidate", { liquidator, user, repayUsd }),
  };

  const admin: AdminApi = {
    setVaultPause: async (op, paused) => {
      await mutate("/v1/admin/vault/pause", { op, paused });
    },
    setPoolPause: async (op, paused) => {
      await mutate("/v1/admin/pool/pause", { op, paused });
    },
    setAssetSupported: async (symbol, supported) => {
      await mutate(`/v1/admin/assets/${encodeURIComponent(symbol)}`, { supported });
    },
    updateAssetConfig: async (symbol, patch) => {
      await mutate(`/v1/admin/assets/${encodeURIComponent(symbol)}`, patch);
    },
    setOraclePaused: async (paused) => {
      await mutate("/v1/admin/oracle", { paused });
    },
    setStalenessThreshold: async (sec) => {
      await mutate("/v1/admin/oracle", { stalenessThresholdSec: sec });
    },
    markPriceStale: async (symbol, stale) => {
      await mutate(`/v1/admin/oracle/prices/${encodeURIComponent(symbol)}`, { stale });
    },
    setFeeders: async (feeders) => {
      await mutate("/v1/admin/oracle", { feeders });
    },
  };

  if (typeof window !== "undefined") {
    void refresh().catch((err) => {
      console.error("[protocol] failed to load state", err);
    });
    setInterval(() => {
      void refresh().catch(() => undefined);
    }, opts.pollIntervalMs);
  }

  return {
    mode: "http",
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset() {
      snapshot = emptySnapshot();
      emit();
    },
    vault,
    pool,
    oracle,
    engine,
    admin,
  };
}
