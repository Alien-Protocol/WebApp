import { truncateAddress } from "@/lib/format";
import { USER_LABELS } from "@/lib/protocol/constants";
import { cn } from "@/lib/cn";

export function AddressChip({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const label = USER_LABELS[address];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-white/25 bg-white/5 px-2.5 py-1 font-exo text-[13px] text-white/85",
        className,
      )}
      title={address}
    >
      {label ? (
        <span className="font-orbitron text-[10px] font-semibold uppercase tracking-wider text-white">
          {label}
        </span>
      ) : null}
      {truncateAddress(address)}
    </span>
  );
}
