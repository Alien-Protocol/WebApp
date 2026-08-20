"use client";

import { AddressChip } from "@/components/app/AddressChip";
import { ConnectWalletButton } from "@/components/app/ConnectWalletButton";
import { EmptyState } from "@/components/app/EmptyState";
import { GlassCard } from "@/components/app/MetricCard";
import { PageHeader } from "@/components/app/PageHeader";
import { useWallet } from "@/context/WalletContext";
import { useProtocolState } from "@/hooks/useProtocol";
import { formatAmount, formatTimestamp, formatUsd, truncateAddress } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { ADDRESSES } from "@/lib/protocol/constants";
import { cn } from "@/lib/cn";

export default function ActivityPage() {
  const { isConnected, address } = useWallet();
  const { events } = useProtocolState();
  const user = address ?? ADDRESSES.you;
  const mine = events;

  if (!isConnected) {
    return (
      <EmptyState
        title="Connect to view activity"
        body="The feed lists vault, pool, engine, and oracle events for the connected address."
        action={<ConnectWalletButton />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Signal log" title="Activity" />
      <p className="text-base text-white/50">
        Connected <AddressChip address={user} />
      </p>

      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="font-raj text-[11px] uppercase tracking-wider text-white/40">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Time</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Asset</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Tx</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((e) => (
                <tr key={e.id} className="border-b border-white/6">
                  <td className="px-5 py-3 text-white/55">{formatTimestamp(e.at)}</td>
                  <td className="px-3 py-3">
                    <span className="font-medium">{e.type}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-white/35">
                      {e.module}
                    </span>
                    {e.type === "Repaid" && e.interestPaid != null ? (
                      <p className="text-xs text-white/40">
                        interest {formatUsd(e.interestPaid)} · principal{" "}
                        {formatUsd(e.principalPaid ?? 0)}
                      </p>
                    ) : null}
                    {e.type === "Liquidated" ? (
                      <p className="text-xs text-white/40">
                        repaid {formatUsd(e.repaid ?? 0)} · seized{" "}
                        {formatUsd(e.seized ?? 0)} · bonus {formatUsd(e.bonus ?? 0)}
                      </p>
                    ) : null}
                    {e.note ? (
                      <p className="text-xs text-white/35">{e.note}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{e.asset ?? "—"}</td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {e.amount != null ? formatAmount(e.amount) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={`${appConfig.explorerTxUrl}/${e.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-white hover:underline"
                    >
                      {truncateAddress(e.txHash, 6, 6)}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "border px-2 py-0.5 font-orbitron text-[10px] uppercase tracking-wider",
                        e.status === "success" && "border-white bg-white text-black",
                        e.status === "pending" && "border-white/40 text-white/70",
                        e.status === "failed" && "border-white/70 text-white",
                      )}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
