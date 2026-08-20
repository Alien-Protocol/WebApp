import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={cn("glass-card", padding && "p-6", className)}>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "cyan" | "violet" | "green" | "red" | "amber";
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-white/50" />
      <p className="font-orbitron text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>
      <div className="mt-3 font-exo text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
        {value}
      </div>
      {hint ? (
        <p className="mt-2 font-exo text-sm text-white/40">{hint}</p>
      ) : null}
    </GlassCard>
  );
}
