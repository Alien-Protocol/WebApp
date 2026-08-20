"use client";

import { AmountInput } from "@/components/app/AmountInput";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import { EmptyState } from "@/components/app/EmptyState";
import { GlassCard, MetricCard } from "@/components/app/MetricCard";
import { PreviewPanel, hfText, usdText } from "@/components/app/PreviewPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { useTx } from "@/context/TxContext";
import { useWallet } from "@/context/WalletContext";
import { useProtocolState } from "@/hooks/useProtocol";
import { formatUsd, parseAmount } from "@/lib/format";
import { ADDRESSES, BORROW_APR_BPS } from "@/lib/mock/constants";
import {
  borrowLimitRemaining,
  ltvPct,
  previewHfAfterBorrow,
  previewHfAfterRepay,
  priceOf,
  splitRepay,
  weightedLiqUsd,
} from "@/lib/mock/math";
import { derivePosition } from "@/lib/mock/store";
import { pool } from "@/lib/protocol";
import { useState } from "react";

export default function BorrowPage() {
  const { isConnected, address } = useWallet();
  const state = useProtocolState();
  const { execute } = useTx();
  const user = address ?? ADDRESSES.you;
  const [tab, setTab] = useState<"borrow" | "repay">("borrow");
  const [amount, setAmount] = useState("");
  const [repayForUser, setRepayForUser] = useState<string>(ADDRESSES.you);
  const n = parseAmount(amount);
  const pos = derivePosition(user, state);
  const debt = state.debts[user];
  const limit = borrowLimitRemaining(pos.collateral, state.assets, debt?.total ?? 0);
  const weighted = weightedLiqUsd(pos.collateral, state.assets);
  const borrowPaused = state.pause.pool.borrow || state.pause.vault.borrow;
  const repayPaused = state.pause.pool.repay;
  const staleForUser = pos.collateral.some((c) => {
    const p = priceOf(c.symbol, state.prices);
    return p && !p.fresh;
  });
  const usdcStale = priceOf("USDC", state.prices)?.fresh === false;
  const oracleBlocked = staleForUser || usdcStale || state.oraclePaused;
  const nextBorrowHf = previewHfAfterBorrow(weighted, debt?.total ?? 0, n);
  const nextLtv = ltvPct(pos.collateralValueUsd, (debt?.total ?? 0) + n);
  const repaySplit = debt
    ? splitRepay(Math.min(n, debt.total), debt)
    : { interestPaid: 0, principalPaid: 0 };
  const nextRepayHf = previewHfAfterRepay(weighted, debt?.total ?? 0, n);

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect to borrow"
        body="Borrow USDC against vault collateral. Repay applies interest first, then principal."
        action={<ConnectWalletButton />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Lending pool" title="Borrow / repay USDC" />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Available borrow limit" value={formatUsd(limit)} hint="calculateLimit" accent="cyan" />
        <MetricCard label="Debt total" value={formatUsd(debt?.total ?? 0)} accent="red" />
        <MetricCard
          label="APR"
          value="8.00%"
          hint={`${BORROW_APR_BPS} bps · V1 fixed`}
          accent="violet"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" className="tab-btn" data-active={tab === "borrow"} onClick={() => setTab("borrow")}>
          Borrow
        </button>
        <button type="button" className="tab-btn" data-active={tab === "repay"} onClick={() => setTab("repay")}>
          Repay
        </button>
      </div>

      {tab === "borrow" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="space-y-4">
            {borrowPaused ? (
              <p className="border border-white/40 bg-white/[0.04] px-3 py-2 font-exo text-sm text-white">
                Pool paused: borrow
              </p>
            ) : null}
            {oracleBlocked ? (
              <p className="border border-white/40 bg-white/[0.04] px-3 py-2 font-exo text-sm text-white">
                Oracle feed stale — borrow disabled until prices are fresh.
              </p>
            ) : null}
            <AmountInput
              symbol="USDC"
              value={amount}
              onChange={setAmount}
              max={limit}
              usdPrice={1}
              disabled={borrowPaused || oracleBlocked}
            />
            <PreviewPanel
              rows={[
                { label: "Health factor", before: hfText(pos.healthFactor), after: hfText(nextBorrowHf) },
                {
                  label: "LTV",
                  before: `${ltvPct(pos.collateralValueUsd, debt?.total ?? 0).toFixed(1)}%`,
                  after: `${nextLtv.toFixed(1)}%`,
                },
                { label: "Debt", before: usdText(debt?.total ?? 0), after: usdText((debt?.total ?? 0) + n) },
              ]}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={borrowPaused || oracleBlocked || n <= 0 || n > limit}
              onClick={() =>
                execute(
                  {
                    title: "Borrow",
                    detail: `borrow(user, USDC, ${n}) against vault collateral.`,
                  },
                  () => pool.borrow(user, "USDC", n),
                  `Borrowed ${n} USDC`,
                )
              }
            >
              Borrow
            </button>
          </GlassCard>
          <GlassCard>
            <h2 className="font-orbitron text-base tracking-wide">V1 notes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-white/55">
              <li>Fixed 8.00% APR (800 bps), linear per-second.</li>
              <li>Limit is weighted max LTV minus current debt.</li>
              <li>Quote precision 7 decimals (10,000,000).</li>
            </ul>
          </GlassCard>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="space-y-4">
            {repayPaused ? (
              <p className="border border-white/40 bg-white/[0.04] px-3 py-2 font-exo text-sm text-white">
                Pool paused: repay
              </p>
            ) : null}
            <p className="text-sm text-white/55">
              Interest due {formatUsd(debt?.accruedInterest ?? 0)} · principal{" "}
              {formatUsd(debt?.principal ?? 0)}
            </p>
            <AmountInput
              symbol="USDC"
              value={amount}
              onChange={setAmount}
              max={Math.min(debt?.total ?? 0, state.wallets[user]?.USDC ?? 0)}
              usdPrice={1}
              disabled={repayPaused}
            />
            <p className="text-sm text-white/60">
              Repayment order: interest first, then principal —{" "}
              {formatUsd(repaySplit.interestPaid)} interest,{" "}
              {formatUsd(repaySplit.principalPaid)} principal.
            </p>
            <PreviewPanel
              rows={[
                { label: "Health factor", before: hfText(pos.healthFactor), after: hfText(nextRepayHf) },
                {
                  label: "Debt",
                  before: usdText(debt?.total ?? 0),
                  after: usdText(Math.max(0, (debt?.total ?? 0) - n)),
                },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={repayPaused || n <= 0}
                onClick={() =>
                  execute(
                    {
                      title: "Repay",
                      detail: `repay(self) ${n} USDC. Interest is applied first.`,
                    },
                    () => pool.repay(user, n),
                    `Repaid ${n} USDC`,
                  )
                }
              >
                Repay
              </button>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron text-base tracking-wide">Repay for</h2>
              <span className="border border-white/30 px-2 py-0.5 font-orbitron text-[10px] uppercase tracking-wider text-white/70">
                V1 preview
              </span>
            </div>
            <p className="text-sm text-white/50">
              payer ≠ user. Uses pool.repayFor so the method stays visible.
            </p>
            <label className="block text-sm text-white/50">
              User to repay
              <select
                value={repayForUser}
                onChange={(e) => setRepayForUser(e.target.value)}
                className="mt-1 w-full border border-white/25 bg-black px-3 py-2 font-exo text-white"
              >
                <option value={ADDRESSES.you}>You</option>
                <option value={ADDRESSES.whale}>Whale</option>
                <option value={ADDRESSES.atRisk}>At-risk</option>
              </select>
            </label>
            <button
              type="button"
              className="btn-ghost"
              disabled={repayPaused || n <= 0}
              onClick={() =>
                execute(
                  {
                    title: "Repay for",
                    detail: `repay_for(payer=you, user=${repayForUser.slice(0, 6)}…, ${n} USDC)`,
                  },
                  () => pool.repayFor(user, repayForUser, n),
                  `Repaid ${n} USDC for ${repayForUser.slice(0, 4)}…`,
                )
              }
            >
              Repay for
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
