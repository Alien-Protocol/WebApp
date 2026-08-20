"use client";

import { AddressChip } from "@/components/app/AddressChip";
import { BpsBadge } from "@/components/app/BpsBadge";
import { GlassCard } from "@/components/app/MetricCard";
import { PageHeader } from "@/components/app/PageHeader";
import { useProtocolState } from "@/hooks/useProtocol";
import { ADDRESSES } from "@/lib/mock/constants";
import type { PoolPauseKey, VaultPauseKey } from "@/lib/mock/types";
import { admin } from "@/lib/protocol";
import { useState } from "react";

const VAULT_OPS: VaultPauseKey[] = [
  "deposit",
  "borrow",
  "withdraw",
  "liquidation",
  "recovery",
];
const POOL_OPS: PoolPauseKey[] = [
  "supply",
  "borrow",
  "repay",
  "withdrawLiquidity",
];

export default function AdminPage() {
  const state = useProtocolState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [feederDraft, setFeederDraft] = useState(state.feeders.join("\n"));

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="font-orbitron text-2xl font-bold tracking-wide">Admin</h1>
        <p className="text-base text-white/50">
          The connected wallet is not an admin. Toggle demo admin to pause
          modules, edit listings, and control the oracle.
        </p>
        <GlassCard className="flex items-center justify-between">
          <span className="text-sm">View as admin</span>
          <Toggle on={isAdmin} onChange={setIsAdmin} />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader kicker="Control plane" title="Admin" />
        <label className="flex items-center gap-2 text-sm text-white/60">
          View as admin
          <Toggle on={isAdmin} onChange={setIsAdmin} />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-orbitron text-base tracking-wide">Vault pauses</h2>
          <ul className="mt-4 space-y-2">
            {VAULT_OPS.map((op) => (
              <li key={op} className="flex items-center justify-between text-sm">
                <span className="capitalize">{op}</span>
                <Toggle
                  on={state.pause.vault[op]}
                  onChange={(v) => admin.setVaultPause(op, v)}
                />
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <h2 className="font-orbitron text-base tracking-wide">Pool pauses</h2>
          <ul className="mt-4 space-y-2">
            {POOL_OPS.map((op) => (
              <li key={op} className="flex items-center justify-between text-sm">
                <span>{op}</span>
                <Toggle
                  on={state.pause.pool[op]}
                  onChange={(v) => admin.setPoolPause(op, v)}
                />
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="font-orbitron text-base tracking-wide">Asset listing</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="font-raj text-[11px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="pb-2">Asset</th>
                <th className="pb-2">Supported</th>
                <th className="pb-2">Decimals</th>
                <th className="pb-2">Max LTV bps</th>
                <th className="pb-2">Liq. threshold bps</th>
              </tr>
            </thead>
            <tbody>
              {state.assets.map((a) => (
                <tr key={a.symbol} className="border-t border-white/8">
                  <td className="py-2">
                    {a.symbol}
                    <div className="text-xs text-white/35">{a.name}</div>
                  </td>
                  <td className="py-2">
                    <Toggle
                      on={a.supported}
                      onChange={(v) => admin.setAssetSupported(a.symbol, v)}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      className="w-16 border border-white/15 bg-black px-1 py-0.5"
                      value={a.tokenDecimals}
                      onChange={(e) =>
                        admin.updateAssetConfig(a.symbol, {
                          tokenDecimals: Number(e.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="py-2">
                    {a.symbol === "USDC" ? (
                      "n/a"
                    ) : (
                      <input
                        type="number"
                        className="w-24 border border-white/15 bg-black px-1 py-0.5"
                        value={a.maxLtvBps}
                        onChange={(e) =>
                          admin.updateAssetConfig(a.symbol, {
                            maxLtvBps: Number(e.target.value),
                          })
                        }
                      />
                    )}
                  </td>
                  <td className="py-2">
                    {a.symbol === "USDC" ? (
                      "n/a"
                    ) : (
                      <input
                        type="number"
                        className="w-24 border border-white/15 bg-black px-1 py-0.5"
                        value={a.liquidationThresholdBps}
                        onChange={(e) =>
                          admin.updateAssetConfig(a.symbol, {
                            liquidationThresholdBps: Number(e.target.value),
                          })
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3">
        <h2 className="font-orbitron text-base tracking-wide">Oracle</h2>
        <div className="flex items-center justify-between text-sm">
          <span>Pause updates</span>
          <Toggle
            on={state.oraclePaused}
            onChange={(v) => admin.setOraclePaused(v)}
          />
        </div>
        <label className="block text-sm text-white/50">
          Staleness threshold (sec)
          <input
            type="number"
            className="mt-1 w-full border border-white/15 bg-black px-3 py-2 font-exo text-white"
            value={state.stalenessThresholdSec}
            onChange={(e) => admin.setStalenessThreshold(Number(e.target.value))}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {state.prices.map((p) => (
            <div
              key={p.symbol}
              className="flex items-center justify-between border border-white/15 px-3 py-2 text-sm"
            >
              <span>
                {p.symbol}{" "}
                <span className={p.fresh ? "text-white" : "text-white/40"}>
                  {p.fresh ? "fresh" : "stale"}
                </span>
              </span>
              <button
                type="button"
                className="btn-ghost !px-3 !py-1"
                onClick={() => admin.markPriceStale(p.symbol, p.fresh)}
              >
                {p.fresh ? "Mark stale" : "Refresh"}
              </button>
            </div>
          ))}
        </div>
        <label className="block text-sm text-white/50">
          Feeder list
          <textarea
            className="mt-1 h-24 w-full border border-white/15 bg-black px-3 py-2 font-mono text-xs text-white"
            value={feederDraft}
            onChange={(e) => setFeederDraft(e.target.value)}
            onBlur={() =>
              admin.setFeeders(
                feederDraft
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </GlassCard>

      <GlassCard>
        <h2 className="font-orbitron text-base tracking-wide">Linked contracts</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <Addr label="Vault" address={ADDRESSES.vault} />
          <Addr label="Pool" address={ADDRESSES.pool} />
          <Addr label="Oracle" address={ADDRESSES.oracle} />
          <Addr label="Engine" address={ADDRESSES.engine} />
          <Addr label="Borrow asset (USDC)" address={ADDRESSES.usdc} />
        </ul>
        <p className="mt-4 text-xs text-white/35">
          Default max LTV <BpsBadge bps={7000} /> · liq. threshold{" "}
          <BpsBadge bps={8000} />
        </p>
      </GlassCard>
    </div>
  );
}

function Addr({ label, address }: { label: string; address: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-white/50">{label}</span>
      <AddressChip address={address} />
    </li>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 border transition ${
        on ? "border-white bg-white/30" : "border-white/20 bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 bg-white transition ${
          on ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}
