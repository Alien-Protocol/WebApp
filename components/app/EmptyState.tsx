import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center border border-dashed border-white/25 bg-white/[0.02] px-6 py-12 text-center">
      <p className="font-orbitron text-lg tracking-wide text-white">{title}</p>
      <p className="mt-2 max-w-md text-base text-white/50">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/8 ${className ?? "h-8"}`}
    />
  );
}
