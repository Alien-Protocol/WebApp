"use client";

import { useTx } from "@/context/TxContext";
import { cn } from "@/lib/cn";

export function ToastStack() {
  const { toasts, dismissToast } = useTx();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={cn(
            "border px-4 py-3 text-left font-exo text-sm",
            t.tone === "success" && "border-white/40 bg-black text-white",
            t.tone === "error" && "border-white/70 bg-black text-white",
            t.tone === "info" && "border-white/25 bg-black text-white/80",
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
