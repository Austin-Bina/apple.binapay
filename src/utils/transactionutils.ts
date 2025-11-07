import { format } from "date-fns";
import { P, match } from "ts-pattern";
import { convertToNaira } from "./money";
import { WalletTransaction, UtilityTransaction, ViewTransaction } from "@type/transaction";
import { TransactionStatus } from "@enum/transaction";
import { getTransactionIcon, upperCaseFirst } from "@utils/index";

/**
 * Format a transaction amount consistently (fiat, crypto, conversion)
 */
export const formatTransactionAmount = (transaction: WalletTransaction) => {
  const form = (transaction.meta?.form ?? "").toLowerCase();
  const amount = Number(transaction.amount ?? 0);

  // --- Case 1: Conversion ---
  if (form === "conversion") {
    const direction = transaction.meta?.direction;
    const rawSymbol =
      direction === "debit"
        ? transaction.meta?.from_symbol ?? transaction.meta?.crypto_asset_symbol
        : transaction.meta?.to_symbol ?? transaction.meta?.crypto_asset_symbol;

    const symbol = (rawSymbol ?? "").toUpperCase();

    // ✅ Handle NGN
    if (symbol === "NGN") {
      return `${direction === "debit" ? "" : "+"}${convertToNaira(amount)}`;
    }

    // Otherwise → treat as crypto
    const decimalPlaces =
      transaction.wallet?.decimal_places ??
      transaction.meta?.decimal_places ??
      8;

    const humanAmount = amount / Math.pow(10, decimalPlaces);
    return `${direction === "debit" ? "" : "+"}${humanAmount} ${symbol}`;
  }

  // --- Case 2: Crypto deposit/withdrawal ---
  const cryptoForms = ["crypto_deposit", "crypto_withdrawal"];
  if (cryptoForms.includes(form)) {
    const decimalPlaces =
      transaction.wallet?.decimal_places ??
      transaction.meta?.decimal_places ??
      8;

    const humanAmount = amount / Math.pow(10, decimalPlaces);
    const symbol = (transaction.meta?.crypto_asset_symbol ?? "CRYPTO").toUpperCase();
    return `${humanAmount} ${symbol}`;
  }

  // --- Case 3: Fiat (NGN & others) ---
  return convertToNaira(amount);
};

/**
 * Format fiat and crypto balances uniformly across the app.
 */
export const formattedBalance = (
  amount: number | string,
  symbol: string,
  decimalPlaces: number = 8
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "0";
  }

  const num = Number(amount);
  const upperSymbol = symbol?.toUpperCase();

  // ✅ Format Naira
  if (upperSymbol === "NGN" || upperSymbol === "NAIRA") {
    return num.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  
  // ✅ Force USDT to always show 2 decimal places
  if (upperSymbol === "USDT") {
    return `${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${upperSymbol}`;
  }

  // ✅ Format Crypto
  return `${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimalPlaces,
  })} ${upperSymbol}`;
};
