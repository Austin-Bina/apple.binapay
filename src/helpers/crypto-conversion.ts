const NO_SPREAD_SYMBOLS = ["USDT", "USDC"];
const isNoSpreadSymbol = (symbol: string) => NO_SPREAD_SYMBOLS.includes(symbol);

export type ConversionResult = {
  finalAmount: number | null;
  spreadApplied?: number | null;
  error?: string;
  convertedAmount?: number | null;
  rateUsed?: number | null;
};

export const calculateConversion = (
  fromSymbol: string,
  toSymbol: string,
  amount: number,
  livePrices: Record<string, number>,
  liveNgnUsdt: { buy: number; sell: number } | null,
  spreadConfig?: { spreadType: "percent" | "flat"; spread: number },
  noSpreadSymbols: string[] = ["USDT", "USDC"]
): ConversionResult => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();
  const isNoSpreadSymbol = (symbol: string) => noSpreadSymbols.includes(symbol);

  if (!from || !to || from === to || isNaN(amount) || amount <= 0) {
    return { finalAmount: null };
  }

  if ((from === "NGN" || to === "NGN") && !liveNgnUsdt) {
    return { finalAmount: null, error: "NGN/USDT rate not set" };
  }

  const getPrice = (symbol: string) => {
    if (symbol === "USDT") return 1;
    if (symbol === "NGN") return null;
    return livePrices[symbol] ?? null;
  };

  const applySpread = (rate: number, type: "percent" | "flat", spread: number, increase: boolean) => {
    if (type === "percent") return increase ? rate * (1 + spread / 100) : rate * (1 - spread / 100);
    if (type === "flat") return increase ? rate + spread : rate - spread;
    return rate;
  };

  let converted: number | null = null;
  let rate: number | null = null;
  let spreadApplied: number | null = null;

  try {
    // NGN → stablecoin (USDT/USDC) — no spread
    if (from === "NGN" && isNoSpreadSymbol(to)) {
      if (to === "USDT") {
        rate = liveNgnUsdt!.sell;
      } else {
        const toPrice = getPrice(to);
        if (!toPrice) throw new Error(`${to} price not found`);
        rate = liveNgnUsdt!.sell * toPrice;
      }
      converted = amount / rate;
      spreadApplied = 0;
    }

    // Stablecoin (USDT/USDC) → NGN — no spread
    else if (to === "NGN" && isNoSpreadSymbol(from)) {
      if (from === "USDT") {
        rate = liveNgnUsdt!.buy;
      } else {
        const fromPrice = getPrice(from);
        if (!fromPrice) throw new Error(`${from} price not found`);
        rate = liveNgnUsdt!.buy * fromPrice;
      }
      converted = amount * rate;
      spreadApplied = 0;
    }

    // NGN → other crypto (apply spread)
    else if (from === "NGN") {
      const toPrice = getPrice(to);
      if (!toPrice || !liveNgnUsdt) throw new Error(`${to} price not found`);
      rate = toPrice * liveNgnUsdt.sell;
      const rateWithSpread = spreadConfig ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, true) : rate;
      spreadApplied = rateWithSpread - rate;
      converted = amount / rateWithSpread;
    }

    // Other crypto → NGN (apply spread)
    else if (to === "NGN") {
      const fromPrice = getPrice(from);
      if (!fromPrice || !liveNgnUsdt) throw new Error(`${from} price not found`);
      rate = fromPrice * liveNgnUsdt.buy;
      const rateWithSpread = spreadConfig ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, false) : rate;
      spreadApplied = rate - rateWithSpread;
      converted = amount * rateWithSpread;
    }

    // Crypto ↔ Crypto — skip spread if either side is a no-spread stablecoin
    else {
      const fromPrice = getPrice(from);
      const toPrice = getPrice(to);
      if (!fromPrice || !toPrice) throw new Error(`${from} or ${to} price not found`);
      rate = toPrice / fromPrice;
      const skipSpread = isNoSpreadSymbol(from) || isNoSpreadSymbol(to);
      const rateWithSpread = spreadConfig && !skipSpread
        ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, false)
        : rate;
      spreadApplied = rate - rateWithSpread;
      converted = amount * rateWithSpread;
    }
  } catch (err: any) {
    return { finalAmount: null, error: err.message };
  }

  return {
    finalAmount: converted,
    convertedAmount: converted,
    rateUsed: rate,
    spreadApplied,
  };
};
