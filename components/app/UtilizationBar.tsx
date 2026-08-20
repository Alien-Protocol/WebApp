import { bpsToPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function UtilizationBar({
  bps,
  className,
}: {
  bps: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, bps / 100));
  const tone =
    pct >= 90 ? "bg-white" : pct >= 70 ? "bg-white/70" : "bg-white/90";
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
          Utilization
        </span>
        <span className="text-base tabular-nums text-white">
          {bpsToPct(bps)}{" "}
          <span className="text-white/40">({bps.toLocaleString()} bps)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden bg-white/10">
        <div
          className={cn("h-full transition-all duration-500", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
