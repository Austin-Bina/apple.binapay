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
  spreadConfig?: { spreadType: "percent" | "flat"; spread: number }
): ConversionResult => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();

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
    // NGN ↔ USDT — no spread
    if (from === "NGN" && to === "USDT") {
      rate = liveNgnUsdt!.sell;
      converted = amount / rate;
      spreadApplied = 0;
    } else if (from === "USDT" && to === "NGN") {
      rate = liveNgnUsdt!.buy;
      converted = amount * rate;
      spreadApplied = 0;
    }

    // NGN → Crypto (buy crypto)
    else if (from === "NGN") {
      const toPrice = getPrice(to);
      if (!toPrice || !liveNgnUsdt) throw new Error(`${to} price not found`);
      rate = toPrice * liveNgnUsdt.sell;
      const rateWithSpread = spreadConfig ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, true) : rate;
      spreadApplied = rateWithSpread - rate;
      converted = amount / rateWithSpread;
    }

    // Crypto → NGN (sell crypto)
    else if (to === "NGN") {
      const fromPrice = getPrice(from);
      if (!fromPrice || !liveNgnUsdt) throw new Error(`${from} price not found`);
      rate = fromPrice * liveNgnUsdt.buy;
      const rateWithSpread = spreadConfig ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, false) : rate;
      spreadApplied = rate - rateWithSpread;
      converted = amount * rateWithSpread;
    }

    // Crypto ↔ Crypto
    else {
      const fromPrice = getPrice(from);
      const toPrice = getPrice(to);
      if (!fromPrice || !toPrice) throw new Error(`${from} or ${to} price not found`);
      rate = toPrice / fromPrice;
      const rateWithSpread = spreadConfig ? applySpread(rate, spreadConfig.spreadType, spreadConfig.spread, false) : rate;
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


