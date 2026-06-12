import { env } from "@env";
import { UtilityTransaction, WalletTransaction } from "@type/transaction";
import { format } from "date-fns";

const upperCaseFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatSecondsToDate = (seconds: number | string) => {
  const stringTime = seconds.toString();
  if (isNaN(parseInt(stringTime, 10))) throw new Error("Invalid seconds");
  return format(new Date(parseInt(stringTime, 10) * 1000), "dd MMM yyyy, hh:mm a");
};

const truncateString = (str: string = "", maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

const CARD_ICON  = require("@assets/icons/bank-building-outline.png");
const NAIRA_ICON = require("@assets/icons/naira-icon.png");


const CRYPTO_ICON_FALLBACKS: Record<string, string> = {
  USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  SOL:  'https://cryptologos.cc/logos/solana-sol-logo.png',
  BTC:  'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  ETH:  'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  BNB:  'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  LTC:  'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
  TRX:  'https://cryptologos.cc/logos/tron-trx-logo.png',
  POL:  'https://cryptologos.cc/logos/polygon-matic-logo.png',
  TON:  'https://cryptologos.cc/logos/toncoin-ton-logo.png',
};

type CryptoAssetMini = { symbol: string; icon_url?: string };

export const getTransactionIcon = (
  transaction: WalletTransaction | UtilityTransaction | null,
  cryptoAssets?: CryptoAssetMini[]
): string | number => {
  const tx = transaction as any;

  if (!tx) return `${env.BASE_URL}/assets/icons/notifications/system.png`;

  // ── Utility: provider_logo on utilityTransaction ──────────────────────
  if (tx?.payment_transaction?.utilityTransaction?.provider_logo) {
    return tx.payment_transaction.utilityTransaction.provider_logo as string;
  }

  // ── Utility: provider in details ──────────────────────────────────────
  if (tx?.payment_transaction?.utilityTransaction?.details?.provider) {
    return `${env.BASE_URL}/assets/images/services/${tx.payment_transaction.utilityTransaction.details.provider}.png`;
  }

  // ── Wallet transaction with meta.form ─────────────────────────────────
  if (tx?.meta?.form) {
    const form: string = tx.meta.form;
    const type: string = tx.type ?? "deposit";

    // Bank / P2P
    if (
      form === 'naira_withdrawal' ||
       form === 'funding' ||
      form === 'naira_deposit'    ||
      form === 'virtual_account'  || 
      form === 'p2p_auto_payment'
    ) {
      return CARD_ICON as number;
    }

    // Crypto
    if (
      form === 'crypto_withdrawal' ||
      form === 'crypto_deposit'    ||
      form === 'conversion'
    ) {
      if (cryptoAssets?.length) {
        let symbol: string | undefined;

       if (form === 'conversion') {
  const fromSymbol = tx.meta.from_symbol as string | undefined;
  const toSymbol   = tx.meta.to_symbol   as string | undefined;
  const direction  = tx.meta.direction   as string | undefined;

  // Use from_symbol for debit side, to_symbol for credit side
  if (direction === 'credit') {
    // "Bought SOL" — show what was received (to_symbol)
    symbol = toSymbol;
  } else {
    // "Sold NGN" / "Sold USDT" — show what was sent (from_symbol)
    symbol = fromSymbol;
  }

  if (!symbol) return NAIRA_ICON as number;


        } else {
          // crypto_withdrawal / crypto_deposit
          symbol =
            tx.meta.crypto_asset_symbol ??
            tx.meta.crypto_asset        ??
            tx.meta.from_symbol         ??
            tx.meta.to_symbol;
        }

        if (symbol) {
          if (symbol.toUpperCase() === 'NGN') return NAIRA_ICON as number;

         const asset = cryptoAssets.find(
  a => a.symbol.toLowerCase() === symbol!.toLowerCase()
);
if (asset?.icon_url && !asset.icon_url.endsWith('.svg')) {
  return asset.icon_url;
}

// SVG or missing — use CDN fallback
const cdnIcon = CRYPTO_ICON_FALLBACKS[symbol.toUpperCase()];
if (cdnIcon) return cdnIcon;
        }
      }

      // cryptoAssets not loaded yet — fallback
      return `${env.BASE_URL}/assets/icons/notifications/${type}.png`;
    }

    // All other forms — type-based fallback
    return `${env.BASE_URL}/assets/icons/notifications/${type}.png`;
  }

  // ── Wallet transaction without meta.form ──────────────────────────────
  if (tx?.type) {
    return `${env.BASE_URL}/assets/icons/notifications/${tx.type}.png`;
  }

  // ── Raw UtilityTransaction ─────────────────────────────────────────────
  if (tx?.provider_logo) {
    return tx.provider_logo as string;
  }

  if (tx?.details?.provider) {
    return `${env.BASE_URL}/assets/images/services/${tx.details.provider}.png`;
  }

  return `${env.BASE_URL}/assets/icons/notifications/system.png`;
};

const debounce = (fn: (...args: any[]) => void, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export { upperCaseFirst, formatSecondsToDate, truncateString, debounce };
