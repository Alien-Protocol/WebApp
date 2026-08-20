"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { protocol } from "@/lib/protocol";
import { ADDRESSES } from "@/lib/protocol/constants";

type WalletStatus = "disconnected" | "connecting" | "connected";

type WalletContextValue = {
  status: WalletStatus;
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    await new Promise((r) => setTimeout(r, 600));
    setAddress(ADDRESSES.you);
    setStatus("connected");
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("disconnected");
    protocol.reset();
  }, []);

  const value = useMemo(
    () => ({
      status,
      address,
      isConnected: status === "connected" && Boolean(address),
      connect,
      disconnect,
    }),
    [status, address, connect, disconnect],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
