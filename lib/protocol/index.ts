"use client";

import { appConfig } from "@/lib/config";
import type { ProtocolClient } from "@/lib/protocol/client";
import { createHttpClient } from "@/lib/protocol/http/adapter";
import { createMockClient } from "@/lib/protocol/mock/adapter";

function createProtocolClient(): ProtocolClient {
  if (appConfig.dataSource !== "http") {
    return createMockClient();
  }
  if (!appConfig.apiBaseUrl) {
    console.warn(
      "[protocol] NEXT_PUBLIC_DATA_SOURCE=http but NEXT_PUBLIC_API_BASE_URL is empty; using mock client",
    );
    return createMockClient();
  }
  return createHttpClient({
    baseUrl: appConfig.apiBaseUrl,
    timeoutMs: appConfig.requestTimeoutMs,
    pollIntervalMs: appConfig.pollIntervalMs,
  });
}

export const protocol = createProtocolClient();
export const vault = protocol.vault;
export const pool = protocol.pool;
export const oracle = protocol.oracle;
export const engine = protocol.engine;
export const admin = protocol.admin;

export type { ProtocolClient } from "@/lib/protocol/client";
export { ProtocolError, isProtocolError } from "@/lib/protocol/errors";
export type {
  AssetConfig,
  Debt,
  PoolPauseKey,
  Position,
  ProtocolSnapshot,
  VaultPauseKey,
} from "@/lib/protocol/types";
