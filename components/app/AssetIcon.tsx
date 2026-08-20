import { cn } from "@/lib/cn";
import {
  EurcLogo,
  TbillLogo,
  TinvLogo,
  TreitLogo,
  UsdcLogo,
  XlmLogo,
} from "@/components/app/TokenLogos";
import type { ReactNode } from "react";

const LOGOS: Record<string, (size: number) => ReactNode> = {
  USDC: (s) => <UsdcLogo size={s} />,
  XLM: (s) => <XlmLogo size={s} />,
  tBILL: (s) => <TbillLogo size={s} />,
  tREIT: (s) => <TreitLogo size={s} />,
  tINV: (s) => <TinvLogo size={s} />,
  EURC: (s) => <EurcLogo size={s} />,
};

export function AssetIcon({
  symbol,
  size = 36,
}: {
  symbol: string;
  size?: number;
}) {
  const logo = LOGOS[symbol];
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-white/30",
      )}
      style={{ width: size, height: size }}
      title={symbol}
    >
      {logo ? (
        logo(size)
      ) : (
        <span
          className="grid h-full w-full place-items-center bg-white font-sans text-[11px] font-bold text-black"
        >
          {symbol.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
