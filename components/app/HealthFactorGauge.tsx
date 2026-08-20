"use client";

import { cn } from "@/lib/cn";
import { formatHf } from "@/lib/format";
import { healthBand, healthLabel } from "@/lib/protocol/math";

export function HealthFactorGauge({
  hf,
  size = 132,
}: {
  hf: number | "inf";
  size?: number;
}) {
  const band = healthBand(hf);
  const numeric = hf === "inf" ? 2 : hf;
  const clamped = Math.min(2.2, Math.max(0, numeric));
  const pct = clamped / 2.2;
  const color =
    band === "very-safe"
      ? "#ffffff"
      : band === "safe"
        ? "#d4d4d4"
        : "#ffffff";
  const pulse = band === "liquidatable";

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn("relative grid place-items-center", pulse && "hf-pulse")}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 314} 314`}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div
              className="font-sans text-2xl font-semibold tabular-nums"
              style={{ color }}
            >
              {formatHf(hf)}
            </div>
            <div className="font-raj text-xs uppercase tracking-[0.16em] text-white/45">
              HF
            </div>
          </div>
        </div>
      </div>
      <div>
        <p className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Health factor
        </p>
        <p className="mt-1 text-base font-medium" style={{ color }}>
          {healthLabel(hf)}
        </p>
        <p className="mt-1 max-w-[18rem] text-sm leading-relaxed text-white/45">
          HF = (Collateral × Liq. threshold) / Debt. Liquidatable below 1.00
          (10,000 bps).
        </p>
      </div>
    </div>
  );
}
