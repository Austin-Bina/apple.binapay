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
};

export const getPairRateDisplay = ({
  fromSymbol,
  toSymbol,
  livePrices,
  liveNgnUsdt,
  spreadConfig,
}: GetPairRateDisplayParams) => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();

  if (!from || !to || from === to) return "";

  const getPrice = (symbol: string) => {
    if (symbol === "USDT") return 1;
    if (symbol === "NGN") return null;
    return livePrices[symbol] ?? null;
  };

  let rate: number | null = null;

  // NGN ↔ USDT — no spread applied
  if (from === "NGN" && to === "USDT" && liveNgnUsdt) {
    rate = liveNgnUsdt.sell;
    return `1 USDT ≈ ₦${rate.toLocaleString()}`;
  }
  if (from === "USDT" && to === "NGN" && liveNgnUsdt) {
    rate = liveNgnUsdt.buy;
    return `1 USDT ≈ ₦${rate.toLocaleString()}`;
  }

  // NGN → Crypto (buy crypto)
  if (from === "NGN" && to !== "USDT") {
    const toPrice = getPrice(to);
    if (!toPrice || !liveNgnUsdt) return "";
    rate = applySpread(toPrice * liveNgnUsdt.sell, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, true);
    return `1 ${to} ≈ ₦${rate.toLocaleString()}`;
  }

  // Crypto → NGN (sell crypto)
  if (from !== "USDT" && to === "NGN") {
    const fromPrice = getPrice(from);
    if (!fromPrice || !liveNgnUsdt) return "";
    rate = applySpread(fromPrice * liveNgnUsdt.buy, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
    return `1 ${from} ≈ ₦${rate.toLocaleString()}`;
  }

  // USDT → Crypto
  if (from === "USDT" && to !== "NGN") {
    const toPrice = getPrice(to);
    if (!toPrice) return "";
    rate = applySpread(toPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, true);
    return `1 ${to} ≈ $${rate.toLocaleString()}`;
  }

  // Crypto → USDT
  if (from !== "NGN" && to === "USDT") {
    const fromPrice = getPrice(from);
    if (!fromPrice) return "";
    rate = applySpread(fromPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
    return `1 ${from} ≈ $${rate.toLocaleString()}`;
  }

  // Crypto ↔ Crypto
  const fromPrice = getPrice(from);
  const toPrice = getPrice(to);
  if (!fromPrice || !toPrice) return "";
  rate = applySpread(toPrice / fromPrice, spreadConfig?.spreadType ?? "percent", spreadConfig?.spread ?? 0, false);
  return `1 ${to} ≈ ${rate.toFixed(6)} ${from}`;
};
