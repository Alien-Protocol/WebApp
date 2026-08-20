import { formatHf, formatUsd } from "@/lib/format";
import { healthLabel } from "@/lib/mock/math";
import type { ReactNode } from "react";

export function PreviewPanel({
  rows,
}: {
  rows: { label: string; before: ReactNode; after: ReactNode }[];
}) {
  return (
    <div className="border border-white/20 bg-black p-4">
      <p className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        Preview
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 font-exo text-sm">
        <span />
        <span className="text-right text-[11px] uppercase tracking-wider text-white/35">
          Now
        </span>
        <span className="text-right text-[11px] uppercase tracking-wider text-white/35">
          After
        </span>
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <span className="text-white/50">{r.label}</span>
            <span className="text-right tabular-nums text-white/70">{r.before}</span>
            <span className="text-right tabular-nums text-white">{r.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function hfText(hf: number | "inf") {
  return `${formatHf(hf)} · ${healthLabel(hf)}`;
}

export function usdText(n: number) {
  return formatUsd(n);
}
