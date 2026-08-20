"use client";

import { useProtocolState } from "@/hooks/useProtocol";

export function PauseBanner() {
  const { pause } = useProtocolState();
  const vault = Object.entries(pause.vault)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const pool = Object.entries(pause.pool)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (!vault.length && !pool.length) return null;
  return (
    <div className="border border-white/40 bg-white/[0.04] px-4 py-3.5 font-exo text-base text-white">
      <span className="inline-flex items-center gap-2 font-orbitron text-[11px] font-semibold uppercase tracking-[0.2em]">
        <span className="dot-blink" />
        Protocol pause
      </span>
      <p className="mt-1 text-white/70">
        {vault.length ? `Vault: ${vault.join(", ")}. ` : null}
        {pool.length ? `Pool: ${pool.join(", ")}.` : null}
      </p>
    </div>
  );
}

export function StaleOracleBanner() {
  const { prices, oraclePaused } = useProtocolState();
  const stale = prices.filter((p) => !p.fresh);
  if (!stale.length && !oraclePaused) return null;
  return (
    <div className="border border-white/40 bg-white/[0.04] px-4 py-3.5 font-exo text-base text-white">
      <span className="inline-flex items-center gap-2 font-orbitron text-[11px] font-semibold uppercase tracking-[0.2em]">
        <span className="dot-blink" />
        Oracle signal
      </span>
      <p className="mt-1 text-white/70">
        {oraclePaused ? "Price updates paused. " : null}
        {stale.length
          ? `Stale feeds: ${stale.map((p) => p.symbol).join(", ")}. Borrow against those assets is blocked.`
          : null}
      </p>
    </div>
  );
}
