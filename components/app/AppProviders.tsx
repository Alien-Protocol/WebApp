"use client";

import { type ReactNode } from "react";
import { TxProvider } from "@/context/TxContext";
import { WalletProvider } from "@/context/WalletContext";
import { useAssetLogos } from "@/hooks/useAssetLogos";

function PrefetchAssetLogos() {
  useAssetLogos();
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WalletProvider>
      <TxProvider>
        <PrefetchAssetLogos />
        {children}
      </TxProvider>
    </WalletProvider>
  );
}
