import { BPS_DENOM } from "@/lib/protocol/constants";

export function truncateAddress(address: string, lead = 4, tail = 4): string {
  if (address.length <= lead + tail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function formatUsd(
  value: number,
  opts: { digits?: number; compact?: boolean } = {},
): string {
  const { digits = 2, compact = false } = opts;
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}k`;
  }
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatAmount(value: number, digits = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatBps(bps: number): string {
  const pct = bps / (BPS_DENOM / 100);
  return `${pct.toFixed(2)}% · ${bps.toLocaleString("en-US")} bps`;
}

export function bpsToPct(bps: number, digits = 2): string {
  return `${(bps / 100).toFixed(digits)}%`;
}

export function formatHf(hf: number | "inf"): string {
  if (hf === "inf") return "∞";
  return hf.toFixed(2);
}

export function relativeTime(unixSec: number, now = Date.now() / 1000): string {
  const delta = Math.max(0, Math.floor(now - unixSec));
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
  return `${Math.floor(delta / 86400)}d ago`;
}

export function formatTimestamp(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fakeTxHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < 16; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, 64);
}

export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return 0;
  return n;
}
