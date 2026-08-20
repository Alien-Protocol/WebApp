"use client";

import { cancelTxSign, confirmTxSign, useTx } from "@/context/TxContext";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

export function TxModal() {
  const { open, phase, request, error, txHash, expertUrl, close } = useTx();
  if (!open || !request) return null;

  const busy = phase === "signing" || phase === "pending";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6">
        <p className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
          Mock transaction
        </p>
        <h2 className="mt-2 font-orbitron text-lg font-semibold tracking-wide text-white">
          {request.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{request.detail}</p>

        <div className="mt-5 space-y-2 border border-white/15 bg-black p-3 text-sm">
          <Row
            k="Status"
            v={
              phase === "idle"
                ? "Awaiting signature"
                : phase === "signing"
                  ? "Signing with wallet…"
                  : phase === "pending"
                    ? "Broadcasting to mock network…"
                    : phase === "success"
                      ? "Confirmed"
                      : "Failed"
            }
          />
          {txHash ? (
            <Row k="Tx" v={truncateAddress(txHash, 8, 8)} />
          ) : null}
          {error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {phase === "idle" ? (
            <>
              <button type="button" className="btn-primary" onClick={() => confirmTxSign()}>
                Sign with wallet
              </button>
              <button type="button" className="btn-ghost" onClick={() => cancelTxSign()}>
                Cancel
              </button>
            </>
          ) : null}
          {busy ? (
            <button type="button" className="btn-primary" disabled>
              {phase === "signing" ? "Signing…" : "Pending…"}
            </button>
          ) : null}
          {phase === "success" ? (
            <>
              {expertUrl ? (
                <a
                  href={expertUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  View on Stellar Expert ↗
                </a>
              ) : null}
              <button type="button" className="btn-primary" onClick={close}>
                Done
              </button>
            </>
          ) : null}
          {phase === "error" ? (
            <button type="button" className="btn-primary" onClick={close}>
              Close
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-[11px] text-white/35">
          Dummy frontend. No network call is made.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40">{k}</span>
      <span className={cn("tabular-nums text-white/85")}>{v}</span>
    </div>
  );
}
