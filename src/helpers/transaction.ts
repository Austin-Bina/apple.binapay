import { convertToNaira } from "../utils/money";
import { TransactionResponse, UtilityTransaction, ViewTransaction, WalletTransaction } from "@type/transaction";
import { route } from "./route";
import API from "@lib/api";
import { format } from "date-fns";
import { store } from "@store/main";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";
import { getTransactionIcon, upperCaseFirst } from "@utils/index";
import { P, match } from "ts-pattern";
import { TransactionStatus } from "@enum/transaction";
import { formatTransactionAmount } from "../utils/transactionutils";
import { TransferDetails } from "@type/transaction";

const formatDate = (date: string) => {
  return format(new Date(date), "MMM dd, yyyy h:mm a");
};

const defaultTransactionResponse: TransactionResponse = {
  error: true,
  error_code: "default_transaction_failed",
  code: 400,
  title: "Transaction Failed 😢",
  description: "We could not make that purchase, please try again or contact support.",
  transaction_info: {
    transaction: null,
    was_billed: false,
    billed_amount: 0,
    was_refunded: false,
  },
  errorFields: [],
};

type Args = {
  details: Record<string, any>;
};

{/*const getTransactionDetails = ({ details }: Args) => {
  return Object.keys(details).map((label) => {
    const formattedValue = typeof details[label] === "boolean" ? (details[label] ? "Yes" : "No") : details[label];
    const formattedLabel = upperCaseFirst(label.replace(/_/g, " "));

    return {
      label: formattedLabel,
      value: formattedValue,
    };
  });
};*/}

// Improved getTransactionDetails with better handling for different data types
const getTransactionDetails = ({ details }: Args) => {
  return Object.keys(details)
    .filter((key) => key !== "epins") // ✅ REMOVE EPINS
    .map((label) => {
      let value = details[label];

      if (typeof value === "boolean") {
        value = value ? "Yes" : "No";
      }

      if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value);
      }

      return {
        label: upperCaseFirst(label.replace(/_/g, " ")),
        value,
      };
    });
};

type ViewResponse =
  | {
      transaction: WalletTransaction;
      type: "wallet";
    }
  | {
      transaction: UtilityTransaction;
      type: "utility";
    }
  | {
      error: boolean;
      reason: string;
    };

type GetTransData = {
  transactionId: string | number;
  onStart?: () => void;
  onFinish?: (data: ViewResponse) => void;
};

const navigateToTransaction = async (args: GetTransData) => {
  const { transactionId, onStart, onFinish } = args;

  try {
    onStart?.();

    const response = await API.get(
      route("transactions.get", {
        params: {
          id: transactionId,
        },
      }),
    );

    const { transaction, type } = response.data;

    store.dispatch(
      addPendingTransaction({
        id: transactionId as any,
        view: transaction,
        data: {},
      }),
    );

    // Be sure to call before you navigate
    onFinish?.({
      transaction,
      type,
    });

    const { navigate } = await getNavigate();

    navigate(SCREENS.MAIN, {
      screen: SCREENS.HOME,
      params: {
        screen: SCREENS.VIEW_TRANSACTION,
        params: {
          transactionId: transactionId as any,
        },
      },
    });
  } catch (error: any) {
    onFinish?.({
      error: true,
      reason: error?.response?.data?.message,
    });
  }
};

const getTransactionStatus = (transaction: WalletTransaction | UtilityTransaction) => {
  // For transfer transactions, derive status from payment_status in meta
  const meta = (transaction as WalletTransaction).meta;
  const transferForms = ['p2p_auto_payment', 'naira_withdrawal', 'naira_deposit'];

  if (meta && transferForms.includes(meta.form)) {
    const ps = meta.payment_status as string | undefined;
    if (ps === 'success')                           return TransactionStatus.Successful;
    if (ps === 'failed')                            return TransactionStatus.Failed;
    if (['pending', 'processing', 'submitted']
        .includes(ps ?? ''))                        return TransactionStatus.Pending;
  }

  return match(transaction)
    .with(
      { payment_transaction: { utilityTransaction: { status: P.string } } },
      ({ payment_transaction }) => payment_transaction.utilityTransaction.status
    )
    .otherwise(() => TransactionStatus.Successful);
};

/**
 * Clean up raw API description strings that contain unformatted crypto amounts.
 * e.g. "Sold 70000.00000000 NGN" → "Sold ₦70,000.00"
 * e.g. "Sold 0.05000000 USDT" → "Sold 0.05 USDT"
 */
const formatDescription = (description: string | undefined): string => {
  if (!description) return "";

  // Match: word + number (with many decimals) + symbol
  return description.replace(
    /(\b\w+\b\s+)([\d]+\.[\d]+)(\s+)([A-Z]+)/g,
    (_, prefix, amount, space, symbol) => {
      const num = parseFloat(amount);
      if (isNaN(num)) return _;

      if (symbol === "NGN") {
        return `${prefix}${num.toLocaleString("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }

      // Crypto — trim trailing zeros but keep at least 2 decimals
      const formatted = num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      });
      return `${prefix}${formatted}${space}${symbol}`;
    }
  );
};

const viewTransactionHelper = (transaction: WalletTransaction | null): ViewTransaction | null => {
  return match(transaction)
    .with({ wallet_id: P.number, meta: {} }, (walletView) => {
      const { meta: details } = walletView;

        const logo = String(getTransactionIcon(walletView));
        const transactionTitle = formatDescription(details.description);
        const transactionDescription = formatDescription(details.description);

      const transactionReference = match(walletView)
        .with(
          { payment_transaction: { utilityTransaction: { status: P.string } } },
          ({ payment_transaction }) => payment_transaction.utilityTransaction.id
        )
        .otherwise(() => walletView.payment_transaction?.id || "");

      const transactionStatus = getTransactionStatus(walletView);

      // ── Detect receipt type ──────────────────────────────────────────────
      const form = details.form as string | undefined;
      const isTransfer = form === 'p2p_auto_payment' 
                || form === 'naira_withdrawal'
                || form === 'naira_deposit';  // ← add this

      const transferDetails: TransferDetails | undefined = isTransfer && details.transfer_details
        ? {
            beneficiary_name:    details.transfer_details.beneficiary_name    ?? null,
            beneficiary_account: details.transfer_details.beneficiary_account ?? null,
            bank_name:           details.transfer_details.bank_name           ?? null,
            sender_name:         details.transfer_details.sender_name         ?? null,
            session_id:          details.transfer_details.session_id          ?? null,
            reference:           details.transfer_details.reference           ?? null,
            provider:            details.transfer_details.provider            ?? null,
            payment_status:      details.transfer_details.payment_status      ?? 'pending',
            amount:              details.transfer_details.amount              ?? null,
            narration:           details.transfer_details.narration           ?? null,
          }
        : undefined;

      const receiptType = match(form)
        .with('p2p_auto_payment', 'naira_withdrawal', 'naira_deposit', () => 'transfer' as const)
        .with('airtime_purchase',                         () => 'airtime'     as const)
        .with('data_purchase',                            () => 'data'        as const)
        .with('electricity_bill',                         () => 'electricity' as const)
        .with('tv_subscription_change',
              'tv_subscription_renew',                    () => 'cable'       as const)
        .with('crypto_withdrawal', 'crypto_deposit',      () => 'crypto'      as const)
        .otherwise(                                       () => 'generic'     as const);

      // ── Transaction status: for transfers, use payment_status from meta ──
      const paymentStatus = details.payment_status as string | undefined;

      // ── Build transactionDetails (existing logic — only for non-transfer) ─
      const transactionDetails = match(walletView)
        .with(
          { payment_transaction: { utilityTransaction: { details: {} } } },
          ({ payment_transaction }) =>
            getTransactionDetails({ details: payment_transaction.utilityTransaction.details })
        )
        .with(
          { payment_transaction: { utilityTransaction: P.nullish } },
          () => {
            // For transfers we still build a minimal details array as fallback
            if (isTransfer && transferDetails) {
              return getTransactionDetails({
                details: {
                  "Transaction Amount": formatTransactionAmount(walletView),
                  "Description": formatDescription(details.description),
                  "Transaction Date":   format(new Date(walletView.created_at), "MMM dd, yyyy h:mm a"),
                },
              });
            }

            const d: Record<string, any> = {
              "Transaction Amount": formatTransactionAmount(walletView),
              "Description": formatDescription(details.description),
              "Transaction Date":   format(new Date(walletView.created_at), "MMM dd, yyyy h:mm a"),
              "Destination":        "BinaPay Wallet",
              "Transaction ID":     walletView.payment_transaction?.id,
            };
            if (walletView.meta.wallet_address) d["Wallet Address"] = walletView.meta.wallet_address;
            if (walletView.meta.tx_hash)         d["Transaction Hash"] = walletView.meta.tx_hash;
            return getTransactionDetails({ details: d });
          }
        )
        .otherwise(() => getTransactionDetails({ details: {} }));

      // ── Highlighted token (electricity etc.) ─────────────────────────────
      const withHighlightedResponse = match(walletView)
        .with(
          { payment_transaction: { utilityTransaction: { details: { Token: P.string.minLength(5) } } } },
          ({ payment_transaction }) => ({
            hasHighlighted: {
              value:    payment_transaction.utilityTransaction.details.Token,
              copyable: true,
            },
          })
        )
        .with(
          { payment_transaction: { utilityTransaction: { details: { Token: P.string.minLength(0) } } } },
          () => ({ hasHighlighted: { value: "Please contact support", copyable: false } })
        )
        .otherwise(() => undefined);

      // ── Epins ─────────────────────────────────────────────────────────────
      const withEpinsResponse = match(walletView)
        .with({
          payment_transaction: {
            utilityTransaction: {
              details: P.shape({
                epins: P.array(P.shape({ serial: P.string, pin: P.string }))
              })
            }
          }
        }, ({ payment_transaction }) => {
          const { details } = payment_transaction.utilityTransaction;
          return {
            transactionDetails: [],
            hasDetails:         false,
            hasHighlighted:     undefined,
            epins: (details.epins ?? []).map((epin: any, index: number) => ({
              id:           epin.id ?? `${walletView.id}-${index}`,
              serial:       epin.serial,
              pin:          epin.pin,
              amount:       epin.amount,
              provider:     epin.provider ?? details.provider ?? "",
              business_name: epin.business_name ?? details.business_name ?? "",
            })),
          };
        })
        .otherwise(() => undefined);

      const hasDetails = Object.keys(transactionDetails).length > 0;

      return {
        transactionTitle,
        transactionDescription,
        transactionDetails,
        hasDetails,
        logo,
        status:        transactionStatus,
        reference:     transactionReference,
        receiptType,
        paymentStatus,
        transferDetails,
        ...(withHighlightedResponse ?? {}),
        ...(withEpinsResponse       ?? {}),
        transactionDate: format(new Date(walletView.created_at), "MMM dd, yyyy h:mm a"),
      };
    })
    .otherwise(() => null);
};

const viewTransactionResponse = (transactionRes: TransactionResponse | null): ViewTransaction | null => {
  const response = transactionRes || defaultTransactionResponse;

  const {
    transaction_info: { transaction },
    ...data
  } = response;

  let extra = {} as any;

  // const hasHighlighted = transaction?.details?.Token ? { value: transaction.details.Token, copyable: true } : undefined;
  const hasDetails = !!transaction?.details && Object.keys(transaction.details).length > 0;

  if (transaction?.details?.Token) {
    if (Array.isArray(transaction.details.Token)) {
      extra = {
        epins: transaction.details.Token.map((token) => ({
          serial: token.serial,
          pin: token.pin,
          provider: transaction.details.provider,
          amount: transaction.details.amount,
          business_name: transaction.details.business_name || "Your Company",
        })),
      };
    } else {
      extra = {
        hasHighlighted: {
          value: transaction.details.Token,
          copyable: true,
        },
      };
    }
  }

  return {
    transactionTitle: data.title,
    transactionDescription: data.description,
    transactionDetails: hasDetails ? getTransactionDetails({ details: transaction?.details }) : [],
    hasDetails,
    ...extra,
    transactionDate: transaction ? format(new Date(transaction.created_at), "MMM dd, yyyy h:mm a") : "",
    logo: getTransactionIcon(transaction),
  };
};

export {
  getTransactionDetails,
  defaultTransactionResponse,
  navigateToTransaction,
  formatDate,
  viewTransactionHelper,
  viewTransactionResponse,
  getTransactionStatus,
  formatDescription,
};
