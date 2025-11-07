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



/*
export type ConversionResult = {
  finalAmount: number | null;
  fee: number | null;
  error?: string;
  convertedAmount?: number | null;
  rateUsed?: number | null;
};

// Explicitly pass all needed parameters
export const calculateConversion = (
  fromSymbol: string,
  toSymbol: string,
  amount: number,
  livePrices: Record<string, number>,
  liveNgnUsdt: { buy: number; sell: number } | null
): ConversionResult => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();

  if (!from || !to || from === to || isNaN(amount) || amount <= 0) {
    return { finalAmount: null, fee: null };
  }

  const feeRate = 0.01; // 1%

  if ((from === "NGN" || to === "NGN") && !liveNgnUsdt) {
    return { finalAmount: null, fee: null, error: "NGN/USDT rate not set" };
  }

  const getPrice = (symbol: string) => {
    if (symbol === "USDT") return 1;
    if (symbol === "NGN") return null;
    return livePrices[symbol] ?? null;
  };

  let converted: number | null = null;
  let rate: number | null = null;

  try {
    if (from === "NGN") {
      if (to === "USDT") {
        rate = liveNgnUsdt!.sell;
        converted = amount / rate;
      } else {
        const toPrice = getPrice(to);
        if (!toPrice) throw new Error(`${to} price not found`);
        converted = amount / liveNgnUsdt!.sell / toPrice;
        rate = toPrice / liveNgnUsdt!.sell;
      }
    } else if (to === "NGN") {
      if (from === "USDT") {
        rate = liveNgnUsdt!.buy;
        converted = amount * rate;
      } else {
        const fromPrice = getPrice(from);
        if (!fromPrice) throw new Error(`${from} price not found`);
        converted = fromPrice * amount * liveNgnUsdt!.buy;
        rate = fromPrice * liveNgnUsdt!.buy;
      }
    } else {
      const fromPrice = getPrice(from);
      const toPrice = getPrice(to);
      if (!fromPrice || !toPrice) throw new Error(`${from} or ${to} price not found`);
      converted = (amount * fromPrice) / toPrice;
      rate = toPrice / fromPrice;
    }
  } catch (err: any) {
    return { finalAmount: null, fee: null, error: err.message };
  }

  const isNgnUsdtSwap = (from === "NGN" && to === "USDT") || (from === "USDT" && to === "NGN");
  const fee = !isNgnUsdtSwap && converted ? converted * feeRate : 0;
  const finalAmount = converted !== null ? converted - fee : null;

  return {
    finalAmount,
    fee,
    convertedAmount: converted,
    rateUsed: rate,
  };
}
  export const getPairRateDisplay = (
  fromSymbol: string,
  toSymbol: string,
  livePrices: Record<string, number>,
  liveNgnUsdt: { buy: number; sell: number } | null
): string => {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();

  if (!from || !to || from === to) return "";

  const getPrice = (symbol: string) => {
    if (symbol === "USDT") return 1;
    if (symbol === "NGN") return null;
    return livePrices[symbol] ?? null;
  };

  if (from === "NGN" && to === "USDT") {
    return liveNgnUsdt ? `1 USDT ≈ ₦${liveNgnUsdt.sell.toLocaleString()}` : "";
  }
  if (from === "USDT" && to === "NGN") {
    return liveNgnUsdt ? `1 USDT ≈ ₦${liveNgnUsdt.buy.toLocaleString()}` : "";
  }

  if (from === "NGN" && to !== "USDT") {
    const toPrice = getPrice(to);
    if (!toPrice || !liveNgnUsdt) return "";
    return `1 ${to} ≈ ₦${(toPrice * liveNgnUsdt.sell).toLocaleString()}`;
  }
  if (from !== "USDT" && to === "NGN") {
    const fromPrice = getPrice(from);
    if (!fromPrice || !liveNgnUsdt) return "";
    return `1 ${from} ≈ ₦${(fromPrice * liveNgnUsdt.buy).toLocaleString()}`;
  }

  // USDT ↔ Crypto
  if (from === "USDT" && to !== "NGN") {
    const toPrice = getPrice(to);
    if (!toPrice) return "";
    return `1 ${to} ≈ $${toPrice.toLocaleString()}`;
  }
  if (from !== "NGN" && to === "USDT") {
    const fromPrice = getPrice(from);
    if (!fromPrice) return "";
    return `1 ${from} ≈ $${fromPrice.toLocaleString()}`;
  }

  // Crypto ↔ Crypto
  const fromPrice = getPrice(from);
  const toPrice = getPrice(to);
  if (!fromPrice || !toPrice) return "";
  return `1 ${to} ≈ ${(toPrice / fromPrice).toFixed(6)} ${from}`;
};



*/
