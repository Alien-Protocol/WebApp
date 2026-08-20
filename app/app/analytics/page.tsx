"use client";

import { AssetIcon } from "@/components/app/AssetIcon";
import { GlassCard, MetricCard } from "@/components/app/MetricCard";
import { UtilizationBar } from "@/components/app/UtilizationBar";
import { PageHeader } from "@/components/app/PageHeader";
import { useProtocolState } from "@/hooks/useProtocol";
import { formatHf, formatUsd, relativeTime } from "@/lib/format";
import { ANALYTICS_HISTORY, LIQUIDATION_STATS } from "@/lib/mock/seed";
import { holdingsToCollateral } from "@/lib/mock/math";
import { allUsers, derivePosition } from "@/lib/mock/store";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#ffffff", "#c8c8c8", "#8a8a8a", "#5c5c5c"];

export default function AnalyticsPage() {
  const state = useProtocolState();
  const positions = allUsers().map((u) => derivePosition(u, state));
  const hfs = positions
    .map((p) => p.healthFactor)
    .filter((h): h is number => h !== "inf");
  const avgHf =
    hfs.reduce((s, h) => s + h, 0) / Math.max(1, hfs.length);
  const mixMap: Record<string, number> = {};
  for (const u of allUsers()) {
    const coll = holdingsToCollateral(
      state.holdings[u] ?? {},
      state.prices,
      state.assets,
    );
    for (const c of coll) {
      mixMap[c.symbol] = (mixMap[c.symbol] ?? 0) + c.valueUsd;
    }
  }
  const mix = Object.entries(mixMap).map(([name, value]) => ({ name, value }));
  const partialRatio =
    LIQUIDATION_STATS.partialCount /
    (LIQUIDATION_STATS.partialCount + LIQUIDATION_STATS.fullCount);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Signal" title="Protocol analytics" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="TVL" value={formatUsd(state.pool.tvlUsd)} accent="violet" />
        <MetricCard
          label="Total borrowed"
          value={formatUsd(state.pool.totalBorrowed)}
          accent="red"
        />
        <MetricCard
          label="Interest accrued"
          value={formatUsd(LIQUIDATION_STATS.interestAccruedUsd)}
          hint="Protocol lifetime (demo)"
          accent="cyan"
        />
        <MetricCard label="Average HF" value={formatHf(avgHf)} accent="green" />
      </div>

      <GlassCard>
        <h2 className="font-orbitron text-base tracking-wide">14-day TVL & borrow</h2>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANALYTICS_HISTORY}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  background: "#000",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
              <Area
                type="monotone"
                dataKey="tvl"
                stroke="#ffffff"
                fill="rgba(255,255,255,0.12)"
                name="TVL"
              />
              <Area
                type="monotone"
                dataKey="borrowed"
                stroke="#9ca3af"
                fill="rgba(255,255,255,0.06)"
                name="Borrowed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4">
          <UtilizationBar bps={state.pool.utilizationBps} />
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-orbitron text-base tracking-wide">Asset mix</h2>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
                  {mix.map((_, i) => (
                    <Cell key={mix[i].name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatUsd(Number(v))}
                  contentStyle={{
                    background: "#000",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-sm">
            {mix.map((m, i) => (
              <li key={m.name} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <AssetIcon symbol={m.name} size={24} />
                  {m.name}
                </span>
                <span className="tabular-nums" style={{ color: COLORS[i] }}>
                  {formatUsd(m.value)}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="space-y-3">
          <h2 className="font-orbitron text-base tracking-wide">Liquidations</h2>
          <p className="text-sm text-white/55">
            Volume {formatUsd(LIQUIDATION_STATS.volumeUsd)} · partial{" "}
            {LIQUIDATION_STATS.partialCount} / full {LIQUIDATION_STATS.fullCount}{" "}
            · partial ratio {(partialRatio * 100).toFixed(0)}%
          </p>
          <h3 className="pt-2 font-raj text-[11px] uppercase tracking-[0.16em] text-white/45">
            Oracle freshness
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {state.prices.map((p) => (
              <div
                key={p.symbol}
                className="border border-white/15 bg-black p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.symbol}</span>
                  <span
                    className={
                      p.fresh ? "text-xs text-white" : "text-xs text-white/40"
                    }
                  >
                    {p.fresh ? "Fresh" : "Stale"}
                  </span>
                </div>
                <p className="mt-1 text-xs tabular-nums text-white/45">
                  {formatUsd(p.price, { digits: 3 })} · {relativeTime(p.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
