"use client";

import { AddressChip } from "@/components/app/AddressChip";
import { AmountInput } from "@/components/app/AmountInput";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import { EmptyState } from "@/components/app/EmptyState";
import { GlassCard } from "@/components/app/MetricCard";
import { PageHeader } from "@/components/app/PageHeader";
import { PreviewPanel, usdText } from "@/components/app/PreviewPanel";
import { useTx } from "@/context/TxContext";
import { useWallet } from "@/context/WalletContext";
import { useProtocolState } from "@/hooks/useProtocol";
import { cn } from "@/lib/cn";
import { formatHf, formatUsd, parseAmount } from "@/lib/format";
import {
  ADDRESSES,
  CLOSE_FACTOR_BPS,
  LIQUIDATION_BONUS_BPS,
  TARGET_HF_AFTER_LIQ_BPS,
} from "@/lib/protocol/constants";
import {
  calculateBonusUsd,
  closeFactorMax,
  healthBand,
  repayToTargetHf,
  weightedLiqUsd,
} from "@/lib/protocol/math";
import { derivePosition, listUsers } from "@/lib/protocol/selectors";
import { engine } from "@/lib/protocol";
import { useMemo, useState } from "react";

type Filter = "all" | "risk" | "liquidatable";

export default function LiquidatePage() {
  const { isConnected, address } = useWallet();
  const state = useProtocolState();
  const { execute } = useTx();
  const [filter, setFilter] = useState<Filter>("liquidatable");
  const [selected, setSelected] = useState<string>(ADDRESSES.atRisk);
  const [amount, setAmount] = useState("");
  const liquidator = address ?? ADDRESSES.you;
  const positions = listUsers(state).map((u) => derivePosition(u, state));
  const filtered = positions.filter((p) => {
    const hf = p.healthFactor;
    const liq = hf !== "inf" && hf < 1;
    const risk = hf !== "inf" && hf < 1.25;
    if (filter === "liquidatable") return liq;
    if (filter === "risk") return risk;
    return p.collateralValueUsd > 0 || (state.debts[p.user]?.total ?? 0) > 0;
  });
  const pos = derivePosition(selected, state);
  const debt = state.debts[selected];
  const paused = state.pause.vault.liquidation;
  const n = parseAmount(amount);
  const liq = pos.healthFactor !== "inf" && pos.healthFactor < 1;

  const suggested = useMemo(() => {
    const d = debt?.total ?? 0;
    if (d <= 0) return 0;
    const thresh =
      pos.collateralValueUsd > 0
        ? weightedLiqUsd(pos.collateral, state.assets) / pos.collateralValueUsd
        : 0;
    return Math.min(repayToTargetHf(pos.collateralValueUsd, thresh, d), closeFactorMax(d));
  }, [debt, pos, state.assets]);

  const bonus = calculateBonusUsd(n);
  const seized = n + bonus;
  const maxRepay = Math.min(
    closeFactorMax(debt?.total ?? 0),
    state.wallets[liquidator]?.USDC ?? 0,
    debt?.total ?? 0,
  );

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect to liquidate"
        body="Permissionless liquidators repay debt and seize collateral plus the 8% bonus."
        action={<ConnectWalletButton />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Liquidation engine"
        title="Permissionless liquidations"
        description="Anyone can liquidate an unhealthy vault. A backend worker is only a backstop if no searcher fires — it is not required for the engine."
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "risk", "liquidatable"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className="tab-btn"
            data-active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "risk" ? "At risk" : "Liquidatable"}
          </button>
        ))}
      </div>

      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="font-raj text-[11px] uppercase tracking-wider text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">User</th>
                <th className="px-3 py-3">HF</th>
                <th className="px-3 py-3 text-right">Debt</th>
                <th className="px-3 py-3 text-right">Collateral</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const band = healthBand(p.healthFactor);
                return (
                  <tr
                    key={p.user}
                    onClick={() => {
                      setSelected(p.user);
                      setAmount("");
                    }}
                    className={cn(
                      "cursor-pointer border-b border-white/6 hover:bg-white/[0.04]",
                      selected === p.user && "bg-white/10",
                    )}
                  >
                    <td className="px-5 py-3">
                      <AddressChip address={p.user} />
                    </td>
                    <td className="px-3 py-3 tabular-nums">{formatHf(p.healthFactor)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatUsd(state.debts[p.user]?.total ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatUsd(p.collateralValueUsd)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "border px-2 py-0.5 font-orbitron text-[10px] font-semibold uppercase tracking-wider",
                          band === "liquidatable" && "border-white bg-white text-black hf-pulse",
                          band === "safe" && "border-white/40 text-white/80",
                          band === "very-safe" && "border-white text-white",
                        )}
                      >
                        {band === "liquidatable" ? "Liquidatable" : band === "safe" ? "Safe" : "Very Safe"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="space-y-3">
          <h2 className="font-orbitron text-base tracking-wide">Selected orbit</h2>
          <AddressChip address={selected} />
          <p className="text-sm text-white/55">
            HF {formatHf(pos.healthFactor)} · close factor{" "}
            {(CLOSE_FACTOR_BPS / 100).toFixed(2)}% ({CLOSE_FACTOR_BPS} bps) ·
            target HF {(TARGET_HF_AFTER_LIQ_BPS / 10000).toFixed(2)} (
            {TARGET_HF_AFTER_LIQ_BPS} bps) · bonus{" "}
            {(LIQUIDATION_BONUS_BPS / 100).toFixed(2)}% ({LIQUIDATION_BONUS_BPS}{" "}
            bps)
          </p>
          <p className="text-sm">
            Suggested calculatePartialRepayment{" "}
            <button
              type="button"
              className="text-white underline"
              onClick={() => setAmount(suggested.toFixed(2))}
            >
              {formatUsd(suggested)}
            </button>
          </p>
          {paused ? (
            <p className="border border-white/40 bg-white/[0.04] px-3 py-2 font-exo text-sm text-white">
              Vault paused: liquidation
            </p>
          ) : null}
          <AmountInput
            symbol="USDC"
            value={amount}
            onChange={setAmount}
            max={maxRepay}
            usdPrice={1}
            disabled={paused || !liq}
          />
          <p className="text-xs text-white/40">
            calculateBonus({formatUsd(n)}) = {formatUsd(bonus)}. Expected seized
            collateral {formatUsd(seized)} (repay + 8% bonus).
          </p>
          <PreviewPanel
            rows={[
              { label: "Repaid", before: "—", after: usdText(n) },
              { label: "Seized (USD)", before: "—", after: usdText(seized) },
              { label: "Bonus", before: "—", after: usdText(bonus) },
            ]}
          />
          <button
            type="button"
            className="btn-danger"
            disabled={paused || !liq || n <= 0 || n > maxRepay}
            onClick={() =>
              execute(
                {
                  title: "Liquidate",
                  detail: `liquidate(${selected.slice(0, 6)}…, repay ${n} USDC)`,
                },
                () => engine.liquidate(liquidator, selected, n),
                `Liquidated · repaid ${n} USDC`,
              )
            }
          >
            Liquidate
          </button>
          {!liq ? (
            <p className="text-sm text-white/40">Healthy account — not liquidatable.</p>
          ) : null}
        </GlassCard>
        <GlassCard>
          <h2 className="font-orbitron text-base tracking-wide">Result preview</h2>
          <p className="mt-3 text-sm text-white/50">
            Mock result shape: {"{ repaid, seized, bonus }"}. Seized is USD
            value of collateral taken, including the liquidation bonus.
          </p>
          <p className="mt-4 font-exo text-xs text-white/60">
            HF = (CollateralValue × LiquidationThreshold) / Debt
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
