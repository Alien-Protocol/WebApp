"use client";

import { useEffect, useState } from "react";
import type { AssetLogoMap } from "@/lib/assets/ids";

let cached: AssetLogoMap | null = null;
let inflight: Promise<AssetLogoMap> | null = null;

function loadLogos(): Promise<AssetLogoMap> {
  if (cached) return Promise.resolve(cached);
  inflight ??= fetch("/api/assets/logos")
    .then((res) => res.json())
    .then((body: { logos?: AssetLogoMap }) => {
      cached = body.logos ?? {};
      return cached;
    })
    .catch(() => {
      cached = {};
      return cached;
    });
  return inflight;
}

export function useAssetLogos(): AssetLogoMap {
  const [logos, setLogos] = useState<AssetLogoMap>(cached ?? {});

  useEffect(() => {
    let cancelled = false;
    void loadLogos().then((next) => {
      if (!cancelled) setLogos(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return logos;
}
