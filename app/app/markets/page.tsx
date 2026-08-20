"use client";

import { AddressChip } from "@/components/app/AddressChip";
import { AssetIcon } from "@/components/app/AssetIcon";
import { BpsBadge } from "@/components/app/BpsBadge";
import { GlassCard } from "@/components/app/MetricCard";
import { PageHeader } from "@/components/app/PageHeader";
import { useProtocolState } from "@/hooks/useProtocol";
import { cn } from "@/lib/cn";
import { formatUsd, relativeTime } from "@/lib/format";
import { COLLATERAL_POSTED } from "@/lib/mock/seed";
import { computeHf, configOf, priceOf } from "@/lib/mock/math";
import type { AssetConfig } from "@/lib/mock/types";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export default function MarketsPage() {
  const state = useProtocolState();
  const [open, setOpen] = useState<string | null>(null);
  const selected = state.assets.find((a) => a.symbol === open);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Markets" title="Assets & oracle freshness" />

      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-base">
            <thead className="font-raj text-[13px] uppercase tracking-wider text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-5 py-4">Asset</th>
                <th className="px-3 py-4">Oracle</th>
                <th className="px-3 py-4">Max LTV</th>
                <th className="px-3 py-4">Liq. threshold</th>
                <th className="px-3 py-4 text-right">Posted / supplied</th>
                <th className="px-5 py-4 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {state.assets.map((a) => {
                const px = priceOf(a.symbol, state.prices);
                const isUsdc = a.symbol === "USDC";
                return (
                  <tr
                    key={a.symbol}
                    className="cursor-pointer border-b border-white/6 hover:bg-white/[0.04]"
                    onClick={() => setOpen(a.symbol)}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-3">
                        <AssetIcon symbol={a.symbol} size={40} />
                        <span>
                          <span className="block text-[15px] font-semibold">{a.symbol}</span>
                          <span className="text-sm text-white/45">{a.name}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-[15px] tabular-nums">{formatUsd(px?.price ?? 0, { digits: a.symbol === "tBILL" || a.symbol === "USDC" || a.symbol === "tINV" ? 3 : 2 })}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="text-white/40">
                          {px ? relativeTime(px.timestamp) : "—"}
                        </span>
                        <FreshBadge fresh={Boolean(px?.fresh)} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isUsdc ? (
                        <span className="text-white/35">n/a</span>
                      ) : (
                        <BpsBadge bps={a.maxLtvBps} />
                      )}
                    </td>
                    <td className="px-3 py-4">
                      {isUsdc ? (
                        <span className="text-white/35">n/a</span>
                      ) : (
                        <BpsBadge bps={a.liquidationThresholdBps} />
                      )}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums">
                      {isUsdc
                        ? formatUsd(state.pool.totalSupply)
                        : formatUsd(COLLATERAL_POSTED[a.symbol] ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {isUsdc ? `${(state.pool.utilizationBps / 100).toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selected ? (
        <AssetDrawer
          asset={selected}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function FreshBadge({ fresh }: { fresh: boolean }) {
  return (
    <span
      className={cn(
        "border px-2.5 py-0.5 font-orbitron text-[10px] font-semibold uppercase tracking-wider",
        fresh
          ? "border-white bg-white text-black"
          : "border-white/40 text-white/50",
      )}
    >
      {fresh ? "Fresh" : "Stale"}
    </span>
  );
}

function AssetDrawer({
  asset,
  onClose,
}: {
  asset: AssetConfig;
  onClose: () => void;
}) {
  const state = useProtocolState();
  const px = priceOf(asset.symbol, state.prices);
  const exampleCollat = 10_000;
  const exampleDebt = 4_000;
  const exampleHf = computeHf(
    exampleCollat * (asset.liquidationThresholdBps / 10_000),
    exampleDebt,
  );
  const cfg = configOf(asset.symbol, state.assets);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="glass-card h-full w-full max-w-md overflow-y-auto rounded-none border-y-0 border-r-0 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AssetIcon symbol={asset.symbol} size={44} />
            <div>
              <h2 className="font-orbitron text-lg">{asset.symbol}</h2>
              <p className="text-sm text-white/50">{asset.name}</p>
            </div>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <Row k="Contract" v={<AddressChip address={asset.asset} />} />
          <Row k="Type" v={asset.type} />
          <Row k="Supported" v={asset.supported ? "Yes" : "No"} />
          <Row k="Token decimals" v={String(cfg?.tokenDecimals ?? 7)} />
          <Row k="Oracle price decimals" v={String(cfg?.oraclePriceDecimals ?? 7)} />
          <Row
            k="Max LTV"
            v={asset.symbol === "USDC" ? "n/a" : `${(asset.maxLtvBps / 100).toFixed(2)}% · ${asset.maxLtvBps} bps`}
          />
          <Row
            k="Liq. threshold"
            v={
              asset.symbol === "USDC"
                ? "n/a"
                : `${(asset.liquidationThresholdBps / 100).toFixed(2)}% · ${asset.liquidationThresholdBps} bps`
            }
          />
          <Row k="Oracle price" v={formatUsd(px?.price ?? 0, { digits: 3 })} />
          <Row k="Fresh" v={px?.fresh ? "Fresh" : "Stale"} />
        </dl>

        {asset.symbol !== "USDC" ? (
          <p className="mt-4 border border-white/10 bg-black p-3 text-xs text-white/55">
            Example: {formatUsd(exampleCollat)} collateral, {formatUsd(exampleDebt)} debt → HF{" "}
            {typeof exampleHf === "number" ? exampleHf.toFixed(2) : exampleHf}.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {asset.symbol !== "USDC" ? (
            <Link href="/app/vault" className="btn-primary text-center">
              Use as collateral
            </Link>
          ) : (
            <>
              <Link href="/app/lend" className="btn-primary text-center">
                Supply
              </Link>
              <Link href="/app/borrow" className="btn-ghost text-center">
                Borrow
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 py-2">
      <dt className="text-white/45">{k}</dt>
      <dd className="text-right text-white">{v}</dd>
    </div>
  );
}
