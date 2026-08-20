import { fetchCoingeckoLogos } from "@/lib/assets/coingecko";
import { NextResponse } from "next/server";

export const revalidate = 86_400;

export async function GET() {
  try {
    const logos = await fetchCoingeckoLogos();
    return NextResponse.json({ logos });
  } catch {
    return NextResponse.json({ logos: {} }, { status: 200 });
  }
}
