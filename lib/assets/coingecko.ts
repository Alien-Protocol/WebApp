import { COINGECKO_IDS, type AssetLogoMap } from "@/lib/assets/ids";

type MarketRow = {
  id: string;
  symbol: string;
  image?: string | null;
};

function coingeckoConfig() {
  const plan = process.env.COINGECKO_API_PLAN === "pro" ? "pro" : "demo";
  const apiKey = process.env.COINGECKO_API_KEY?.trim() ?? "";
  const apiBase =
    process.env.COINGECKO_API_BASE?.replace(/\/$/, "") ||
    (plan === "pro"
      ? "https://pro-api.coingecko.com/api/v3"
      : "https://api.coingecko.com/api/v3");
  const headerName =
    plan === "pro" ? "x-cg-pro-api-key" : "x-cg-demo-api-key";
  return { apiBase, apiKey, headerName };
}

/** One CoinGecko /coins/markets call → symbol → logo URL. */
export async function fetchCoingeckoLogos(): Promise<AssetLogoMap> {
  const { apiBase, apiKey, headerName } = coingeckoConfig();
  const ids = Object.values(COINGECKO_IDS).join(",");
  const url = `${apiBase}/coins/markets?vs_currency=usd&ids=${ids}&per_page=${Object.keys(COINGECKO_IDS).length}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers[headerName] = apiKey;

  const res = await fetch(url, {
    headers,
    next: { revalidate: 86_400 },
  });
  if (!res.ok) {
    throw new Error(`CoinGecko ${res.status}`);
  }

  const rows = (await res.json()) as MarketRow[];
  const byId = new Map(rows.map((row) => [row.id, row.image ?? ""]));
  const logos: AssetLogoMap = {};
  for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
    const image = byId.get(id);
    if (image) logos[symbol] = image;
  }
  return logos;
}
