import { formatBps } from "@/lib/format";

export function BpsBadge({ bps }: { bps: number }) {
  return (
    <span className="inline-flex items-center border border-white/25 bg-white/5 px-2.5 py-1 font-exo text-[13px] tabular-nums text-white">
      {formatBps(bps)}
    </span>
  );
}
