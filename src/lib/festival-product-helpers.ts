"use client";

import { useEffect, useMemo, useState } from "react";
import type { MenuItem } from "./types";

function fallbackSpiceLevel(item: MenuItem) {
  const text = `${item.name} ${item.description}`.toLowerCase();
  if (text.includes("3x") || text.includes("volcano") || text.includes("extra hot")) return 5;
  if (text.includes("habanero") || text.includes("hot chicken") || text.includes("spicy stir")) return 4;
  if (text.includes("spicy") || text.includes("shin")) return 3;
  if (text.includes("mild") || text.includes("cheese") || text.includes("carbonara")) return 2;
  return 1;
}

export function spiceLevel(item: MenuItem) {
  return Math.min(5, Math.max(0, Number(item.spice_level ?? fallbackSpiceLevel(item))));
}

export function addonImage(item: MenuItem) {
  const name = item.name.toLowerCase();
  if (name.includes("chicken dumpling")) return "/addon-chicken-dumplings.png";
  if (name.includes("sausage corn dog")) return "/addon-sausage-corn-dog.png";
  if (name.includes("raw")) return "/addon-raw-egg.png";
  if (name.includes("boiled")) return "/addon-boiled-egg.png";
  if (name.includes("corn dog")) return "/addon-corn-dog.png";
  if (name.includes("corn")) return "/addon-corn.png";
  if (name.includes("cheese")) return "/addon-cheese.png";
  if (name.includes("spring onion")) return "/addon-spring-onions.png";
  if (name.includes("sausage") || name.includes("hot dog")) return "/addon-sausage.png";
  if (name.includes("chicken")) return "/addon-shredded-chicken.png";
  return null;
}

function productImageKey(name: string) {
  return name.toLowerCase().replace(/\(halal\)/g, "").replace(/\brosted\b/g, "roasted").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const localProductImageAliases: Record<string, string> = {
  "broad-noodles-spicy-hot-flavour": "/menu-products/broad-noodles-spicy-hot-halal.png",
  "chicken-dumpling": "/addon-chicken-dumplings.png",
  "chicken-dumplings": "/addon-chicken-dumplings.png",
  "chicken-dumplings-5-pieces": "/addon-chicken-dumplings.png",
  "otogi-cheese-ramen": "/menu-products/otoki-cheese-ramen.png",
  "otogi-jin-chicken": "/menu-products/otoki-jin-chicken.png",
  "otogi-jin-ramen-mild": "/menu-products/otoki-jin-ramen-mild.png",
  "otogi-jin-ramen-spicy": "/menu-products/otoki-jin-ramen-spicy.png",
  "otogi-spicy-stir-fry": "/menu-products/otoki-spicy-stir-fry.png",
  "ottogi-cheese-ramen": "/menu-products/otoki-cheese-ramen.png",
  "ottogi-jin-chicken": "/menu-products/otoki-jin-chicken.png",
  "ottogi-jin-ramen-mild": "/menu-products/otoki-jin-ramen-mild.png",
  "ottogi-jin-ramen-spicy": "/menu-products/otoki-jin-ramen-spicy.png",
  "ottogi-spicy-stir-fry": "/menu-products/otoki-spicy-stir-fry.png",
  "samyang-quattro-cheese": "/menu-products/samyang-quattro-cheese-halal.png",
  "samyang-quattro-cheese-halal": "/menu-products/samyang-quattro-cheese-halal.png",
  "samyang-buldak-quattro-cheese-halal": "/menu-products/samyang-quattro-cheese-halal.png"
};

function productImageCandidates(item: MenuItem) {
  const imageKey = productImageKey(item.name);
  const localAlias = localProductImageAliases[imageKey];
  const localImage = localAlias ?? `/menu-products/${imageKey}.png`;
  const candidates = localAlias ? [localAlias, item.image_url] : [item.image_url, localImage];
  const filename = item.image_url?.split("/").pop();
  if (filename) candidates.splice(1, 0, `/menu-products/${filename}`);
  return Array.from(new Set(candidates.filter((candidate): candidate is string => Boolean(candidate))));
}

export function useProductImage(item: MenuItem) {
  const candidates = useMemo(() => productImageCandidates(item), [item.category_id, item.image_url, item.name]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  useEffect(() => setCandidateIndex(0), [candidates]);
  return {
    imageSrc: candidates[candidateIndex] ?? null,
    tryNextImage: () => setCandidateIndex((current) => Math.min(current + 1, candidates.length))
  };
}

