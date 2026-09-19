// rate-display.ts
type SpreadConfig = {
  spreadType: "percent" | "flat";
  spread: number;
};

export const applySpread = (
  rate: number,
  type: "percent" | "flat",
  spread: number,
  isBuy: boolean
) => {
  if (type === "percent") return isBuy ? rate * (1 + spread / 100) : rate * (1 - spread / 100);
  if (type === "flat") return isBuy ? rate + spread : rate - spread;
  return rate;
};

type GetPairRateDisplayParams = {
  fromSymbol: string;
  toSymbol: string;
  livePrices: Record<string, number>;
  liveNgnUsdt: { buy: number; sell: number } | null;
  spreadConfig?: SpreadConfig | null;
  noSpreadSymbols?: string[];
};

export const getPairRateDisplay = ({
  fromSymbol,
  toSymbol,
  livePrices,
  liveNgnUsdt,
  spreadConfig,
  noSpreadSymbols = ["USDT"],
}: GetPairRateDisplayParams) => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();
  const isNoSpreadSymbol = (symbol: string) => noSpreadSymbols.includes(symbol);

  if (!from || !to || from === to) return "";

  const getPrice = (symbol: string) => {
    if (symbol === "USDT") return 1;
    if (symbol === "NGN") return null;
    return livePrices[symbol] ?? null;
  };

  let rate: number | null = null;

  // NGN ↔ stablecoin (USDT/USDC) — no spread applied
  if (from === "NGN" && isNoSpreadSymbol(to) && liveNgnUsdt) {
    if (to === "USDT") {
      rate = liveNgnUsdt.sell;
    } else {
      const toPrice = getPrice(to);
      if (!toPrice) return "";
      rate = liveNgnUsdt.sell * toPrice;
    }
    return `1 ${to} ≈ ₦${rate.toLocaleString()}`;
  }
  if (isNoSpreadSymbol(from) && to === "NGN" && liveNgnUsdt) {
    if (from === "USDT") {
      rate = liveNgnUsdt.buy;
    } else {
      const fromPrice = getPrice(from);
      if (!fromPrice) return "";
      rate = liveNgnUsdt.buy * fromPrice;
    }
    return `1 ${from} ≈ ₦${rate.toLocaleString()}`;
  }

  // NGN → other crypto (buy, apply spread)
  if (from === "NGN" && !isNoSpreadSymbol(to)) {
    const toPrice = getPrice(to);
    if (!toPrice || !liveNgnUsdt) return "";
    rate = applySpread(toPrice * liveNgnUsdt.sell, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, true);
    return `1 ${to} ≈ ₦${rate.toLocaleString()}`;
  }

  // other crypto → NGN (sell, apply spread)
  if (!isNoSpreadSymbol(from) && to === "NGN") {
    const fromPrice = getPrice(from);
    if (!fromPrice || !liveNgnUsdt) return "";
    rate = applySpread(fromPrice * liveNgnUsdt.buy, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
    return `1 ${from} ≈ ₦${rate.toLocaleString()}`;
  }

  // stablecoin (USDT/USDC) → other crypto
  if (isNoSpreadSymbol(from) && to !== "NGN") {
    const fromPrice = getPrice(from) ?? 1; // USDT/USDC ≈ $1 baseline
    const toPrice = getPrice(to);
    if (!toPrice) return "";
    rate = applySpread(toPrice / fromPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, true);
    return `1 ${to} ≈ $${rate.toLocaleString()}`;
  }

  // Crypto → stablecoin (USDT/USDC)
  if (from !== "NGN" && isNoSpreadSymbol(to)) {
    const fromPrice = getPrice(from);
    const toPrice = getPrice(to) ?? 1; // USDT/USDC ≈ $1 baseline
    if (!fromPrice) return "";
    rate = applySpread(fromPrice / toPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
    return `1 ${from} ≈ $${rate.toLocaleString()}`;
  }

  // Crypto ↔ Crypto (neither side is NGN or a no-spread stablecoin)
  const fromPrice = getPrice(from);
  const toPrice = getPrice(to);
  if (!fromPrice || !toPrice) return "";
  rate = applySpread(toPrice / fromPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
  return `1 ${to} ≈ ${rate.toFixed(6)} ${from}`;
};
