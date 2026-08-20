"use client";

import { HealthFactorGauge } from "@/components/app/HealthFactorGauge";
import { GlassCard, MetricCard } from "@/components/app/MetricCard";
import { AssetIcon } from "@/components/app/AssetIcon";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import { EmptyState } from "@/components/app/EmptyState";
import { UtilizationBar } from "@/components/app/UtilizationBar";
import { PageHeader } from "@/components/app/PageHeader";
import { useTx } from "@/context/TxContext";
import { useWallet } from "@/context/WalletContext";
import { useProtocolState } from "@/hooks/useProtocol";
import { formatAmount, formatHf, formatUsd, relativeTime } from "@/lib/format";
import { ADDRESSES, BORROW_APR_BPS } from "@/lib/protocol/constants";
import {
  borrowLimitRemaining,
  computeHf,
  previewHfAfterBorrow,
  weightedLiqUsd,
  weightedMaxBorrowUsd,
} from "@/lib/protocol/math";
import { derivePosition } from "@/lib/protocol/selectors";
import { pool } from "@/lib/protocol";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const { isConnected } = useWallet();
  const state = useProtocolState();
  const { execute } = useTx();
  const pos = derivePosition(ADDRESSES.you, state);
  const debt = state.debts[ADDRESSES.you];
  const supply = state.supplies[ADDRESSES.you] ?? 0;
  const limit = borrowLimitRemaining(
    pos.collateral,
    state.assets,
    debt?.total ?? 0,
  );
  const weighted = weightedLiqUsd(pos.collateral, state.assets);
  const events = state.events.filter(
    (e) => !e.user || e.user === ADDRESSES.you,
  );

  return (
    <div className="space-y-6">
      <PageHeader kicker="Orbit overview" title="Protocol dashboard" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Collateral value"
          value={isConnected ? formatUsd(pos.collateralValueUsd) : "—"}
          hint="Vault marked to oracle"
          accent="violet"
        />
        <MetricCard
          label="Total debt"
          value={isConnected ? formatUsd(debt?.total ?? 0) : "—"}
          hint={`Principal ${formatUsd(debt?.principal ?? 0)} + interest`}
          accent="red"
        />
        <GlassCard>
          {isConnected ? (
            <HealthFactorGauge hf={pos.healthFactor} />
          ) : (
            <>
              <p className="font-raj text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Health factor
              </p>
              <p className="mt-2 text-xl text-white/30">Connect wallet</p>
            </>
          )}
        </GlassCard>
        <MetricCard
          label="Borrow limit remaining"
          value={isConnected ? formatUsd(limit) : "—"}
          hint="Weighted max LTV − debt"
          accent="cyan"
        />
        <MetricCard
          label="Your supplied liquidity"
          value={isConnected ? formatUsd(supply) : "—"}
          hint="USDC in the lending pool"
          accent="green"
        />
        <GlassCard>
          <UtilizationBar bps={state.pool.utilizationBps} />
          <p className="mt-3 text-xs text-white/40">
            Protocol TVL {formatUsd(state.pool.tvlUsd, { compact: true })} · APR{" "}
            {(BORROW_APR_BPS / 100).toFixed(2)}% ({BORROW_APR_BPS} bps)
          </p>
        </GlassCard>
      </div>

      {!isConnected ? (
        <EmptyState
          title="Wallet not connected"
          body="Connect the mock wallet to inspect your vault, debt, and supply. Protocol-wide stats above stay visible."
          action={<ConnectWalletButton />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard>
            <h2 className="font-orbitron text-base tracking-wide">Position</h2>
            <p className="mt-1 text-xs text-white/40">
              Collateral breakdown in the vault.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="font-raj text-[11px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="pb-2">Asset</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-right">USD</th>
                    <th className="pb-2 text-right">Vault %</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.collateral.map((c) => (
                    <tr key={c.symbol} className="border-t border-white/8">
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                        <AssetIcon symbol={c.symbol} size={32} />
                          {c.symbol}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatAmount(c.amount)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatUsd(c.valueUsd)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-white/50">
                        {pos.collateralValueUsd
                          ? (
                              (c.valueUsd / pos.collateralValueUsd) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="font-orbitron text-base tracking-wide">Debt</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <DebtRow k="Principal" v={formatUsd(debt?.principal ?? 0)} />
              <DebtRow
                k="Accrued interest"
                v={formatUsd(debt?.accruedInterest ?? 0)}
              />
              <DebtRow
                k="Borrow APR"
                v={`8.00% · ${BORROW_APR_BPS} bps`}
              />
              <DebtRow
                k="Last accrual"
                v={
                  debt
                    ? relativeTime(debt.lastAccrualAt)
                    : "—"
                }
              />
              <DebtRow k="Total" v={formatUsd(debt?.total ?? 0)} />
            </dl>
            <button
              type="button"
              className="btn-ghost mt-4"
              onClick={() =>
                execute(
                  {
                    title: "Accrue interest",
                    detail:
                      "Linear per-second accrual on ledger time. Interest is applied to your USDC debt.",
                  },
                  () => pool.accrueInterest(ADDRESSES.you),
                  "Interest accrued",
                )
              }
            >
              Accrue interest
            </button>
          </GlassCard>
        </div>
      )}

      {isConnected ? (
        <HealthPreview
          weightedLiq={weighted}
          maxBorrowUsd={weightedMaxBorrowUsd(pos.collateral, state.assets)}
          debt={debt?.total ?? 0}
          collateralUsd={pos.collateralValueUsd}
        />
      ) : null}

      <GlassCard>
        <h2 className="font-orbitron text-base tracking-wide">Protocol constants</h2>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <Const k="Borrow APR (V1)" v="8.00% · 800 bps" />
          <Const k="Default max LTV" v="70% · 7,000 bps" />
          <Const k="Liq. threshold" v="80% · 8,000 bps" />
          <Const k="Healthy HF" v="1.00 · 10,000 bps" />
          <Const k="Target HF after liq." v="1.10 · 11,000 bps" />
          <Const k="Liquidation bonus" v="8% · 800 bps" />
          <Const k="Close factor" v="50% · 5,000 bps" />
          <Const k="Quote precision" v="7 decimals (10,000,000)" />
        </dl>
        <p className="mt-3 text-xs text-white/35">
          Interest: linear per-second on ledger time. Repayment: interest first,
          then principal.
        </p>
      </GlassCard>

      <GlassCard>
        <h2 className="font-orbitron text-base tracking-wide">Recent activity</h2>
        <ul className="mt-4 divide-y divide-white/8 text-sm">
          {(isConnected ? events : state.events).slice(0, 5).map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <span className="text-white/85">{e.type}</span>
              <span className="text-white/45">
                {e.asset ?? e.note ?? "—"}{" "}
                {e.amount != null ? formatAmount(e.amount) : ""}
              </span>
              <span className="text-xs text-white/35">{relativeTime(e.at)}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function Const({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/6 py-1.5">
      <dt className="text-white/45">{k}</dt>
      <dd className="tabular-nums text-white/90">{v}</dd>
    </div>
  );
}

function DebtRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-white/45">{k}</dt>
      <dd className="tabular-nums text-white">{v}</dd>
    </div>
  );
}

function HealthPreview({
  weightedLiq,
  maxBorrowUsd,
  debt,
  collateralUsd,
}: {
  weightedLiq: number;
  maxBorrowUsd: number;
  debt: number;
  collateralUsd: number;
}) {
  const [mode, setMode] = useState<"borrow" | "withdraw">("borrow");
  const [pct, setPct] = useState(0);
  const extraBorrow = ((maxBorrowUsd - debt) * pct) / 100;
  const withdrawUsd = (collateralUsd * pct) / 100;
  const nextHf = useMemo(() => {
    if (mode === "borrow") return previewHfAfterBorrow(weightedLiq, debt, extraBorrow);
    const remaining = Math.max(0, collateralUsd - withdrawUsd);
    const ratio = collateralUsd > 0 ? remaining / collateralUsd : 1;
    return computeHf(weightedLiq * ratio, debt);
  }, [mode, extraBorrow, weightedLiq, debt, collateralUsd, withdrawUsd]);

  return (
    <GlassCard>
      <h2 className="font-orbitron text-base tracking-wide">Health preview</h2>
      <p className="mt-1 text-xs text-white/40">
        Client-side simulation. Does not submit a transaction.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="tab-btn"
          data-active={mode === "borrow"}
          onClick={() => setMode("borrow")}
        >
          Borrow
        </button>
        <button
          type="button"
          className="tab-btn"
          data-active={mode === "withdraw"}
          onClick={() => setMode("withdraw")}
        >
          Withdraw
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
        className="mt-4 w-full"
      />
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <p className="text-white/50">
          {mode === "borrow" ? "Extra borrow" : "Withdraw USD"}{" "}
          <span className="text-white">
            {formatUsd(mode === "borrow" ? extraBorrow : withdrawUsd)}
          </span>
        </p>
        <p className="text-white/50">
          HF now <span className="text-white">{formatHf(computeHf(weightedLiq, debt))}</span>
        </p>
        <p className="text-white/50">
          HF after <span className="text-white">{formatHf(nextHf)}</span>
        </p>
      </div>
    </GlassCard>
  );
}
