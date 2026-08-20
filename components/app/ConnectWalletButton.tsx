"use client";

import { useWallet } from "@/context/WalletContext";
import { useProtocolState } from "@/hooks/useProtocol";
import { formatAmount, truncateAddress } from "@/lib/format";
import { ADDRESSES } from "@/lib/mock/constants";
import { AssetIcon } from "@/components/app/AssetIcon";
import { useState } from "react";

export function ConnectWalletButton() {
  const { status, address, connect, disconnect, isConnected } = useWallet();
  const { wallets } = useProtocolState();
  const [open, setOpen] = useState(false);
  const bal = wallets[ADDRESSES.you] ?? {};

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={() => connect()}
        disabled={status === "connecting"}
        className="btn-primary"
      >
        {status === "connecting" ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost"
      >
        <span className="font-orbitron text-[11px] tracking-[0.14em] text-white">
          {truncateAddress(address ?? "", 4, 4)}
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-72 border border-white/25 bg-black p-4">
          <p className="break-all font-exo text-xs leading-relaxed text-white/70">
            {address}
          </p>
          <div className="mt-3 space-y-2 font-exo text-sm tabular-nums text-white/80">
            <p className="flex items-center gap-2">
              <AssetIcon symbol="USDC" size={20} /> {formatAmount(bal.USDC ?? 0)} USDC
            </p>
            <p className="flex items-center gap-2">
              <AssetIcon symbol="XLM" size={20} /> {formatAmount(bal.XLM ?? 0)} XLM
            </p>
            <p className="flex items-center gap-2">
              <AssetIcon symbol="tBILL" size={20} /> {formatAmount(bal.tBILL ?? 0)} tBILL
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost mt-4 w-full"
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
          >
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
