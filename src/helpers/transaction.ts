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

const getTransactionDetails = ({ details }: Args) => {
  return Object.keys(details).map((label) => {
    const formattedValue = typeof details[label] === "boolean" ? (details[label] ? "Yes" : "No") : details[label];
    const formattedLabel = upperCaseFirst(label.replace(/_/g, " "));

    return {
      label: formattedLabel,
      value: formattedValue,
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

const viewTransactionHelper = (transaction: WalletTransaction | null): ViewTransaction | null => {
  return match(transaction)
    .with({ wallet_id: P.number, meta: {} }, (walletView) => {
      const { meta: details } = walletView;

      const logo = getTransactionIcon(walletView);
      const transactionTitle = details.description;
      const transactionDescription = details.description;

      const transactionDetails = match(walletView)
        .with({ payment_transaction: { utilityTransaction: { details: {} } } }, ({ payment_transaction }) => {
          const {
            utilityTransaction: { details },
          } = payment_transaction;

          return getTransactionDetails({ details });
        })
        .with({ payment_transaction: { utilityTransaction: P.nullish || undefined } }, ({ payment_transaction }) => {
          // UtilityTransaction is null, it is probably a wallet transaction
          return getTransactionDetails({
            details: {
              "Transaction Amount": convertToNaira(walletView.amount, true),
              Description: walletView.meta.description,
              "Transaction Date": format(new Date(walletView.created_at), "MMM dd, yyyy h:mm a"),
              Destination: "Binapay Wallet",
              "Transaction ID": walletView.payment_transaction?.id,
            },
          });
        })
        .otherwise(() => getTransactionDetails({ details: {} }));

      // Try to extract the token from elec or cable subscription
      const withHighlightedResponse = match(walletView)
        .with(
          { payment_transaction: { utilityTransaction: { details: { Token: P.string.minLength(5) } } } },
          ({ payment_transaction }) => {
            const { utilityTransaction } = payment_transaction;
            const { details } = utilityTransaction;

            const token = details.Token;

            return {
              hasHighlighted: {
                value: token,
                copyable: true,
              },
            };
          },
        )
        .with({ payment_transaction: { utilityTransaction: { details: { Token: P.string.minLength(0) } } } }, () => ({
          hasHighlighted: {
            value: "Please contact support",
            copyable: false,
          },
        }))
        .otherwise(() => undefined);

      const withEpinsResponse = match(walletView)
        // Get Epins Token
        .with(
          {
            payment_transaction: {
              utilityTransaction: { details: { Token: P.array({ serial: P.string, pin: P.string }) } },
            },
          },
          ({ payment_transaction }) => {
            const { utilityTransaction } = payment_transaction;
            const { details } = utilityTransaction;

            return {
              transactionDetails: [],
              hasDetails: false,
              hasHighlighted: undefined,
              epins: details.Token.map((epin) => ({
                serial: epin.serial,
                pin: epin.pin,
                provider: details.provider,
                amount: details.amount,
                business_name: details.business_name || "Your Company",
              })),
            };
          },
        )
        .otherwise(() => undefined);

      const hasDetails = Object.keys(transactionDetails).length > 0;

      return {
        transactionTitle,
        transactionDescription,
        transactionDetails,
        hasDetails,
        logo,
        ...(withHighlightedResponse ? withHighlightedResponse : {}),
        ...(withEpinsResponse ? withEpinsResponse : {}),
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
};
