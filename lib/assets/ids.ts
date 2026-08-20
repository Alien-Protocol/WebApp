export const COINGECKO_IDS = {
  USDC: "usd-coin",
  XLM: "stellar",
  EURC: "euro-coin",
} as const;

export type CoingeckoSymbol = keyof typeof COINGECKO_IDS;

export type AssetLogoMap = Partial<Record<string, string>>;
