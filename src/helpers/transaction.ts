import { TransactionForm, TransactionStatus } from "@enum/transaction";
import { formatToNaira } from "../utils/money";
import { TransactionResponse, UtilityTransaction, WalletTransaction } from "@type/transaction";
import { route } from "./route";
import API from "@lib/api";
import { format } from "date-fns";
import { store } from "@store/main";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";

const airtimeTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Airtime Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Airtime Purchase Pending 😢",
  [TransactionStatus.Failed]: "Airtime Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Airtime Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Airtime Purchase Initiated 😢",
};

const dataTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Data Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Data Purchase Pending 😢",
  [TransactionStatus.Failed]: "Data Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Data Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Data Purchase Initiated 😢",
};

const electricityTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Electricity Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Electricity Purchase Pending 😢",
  [TransactionStatus.Failed]: "Electricity Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Electricity Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Electricity Purchase Initiated 😢",
};

const cableTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Cable Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Cable Purchase Pending 😢",
  [TransactionStatus.Failed]: "Cable Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Cable Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Cable Purchase Initiated 😢",
};

const educationTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Education Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Education Purchase Pending 😢",
  [TransactionStatus.Failed]: "Education Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Education Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Education Purchase Initiated 😢",
};

const epinTitleMap: { [key in TransactionStatus]: string } = {
  [TransactionStatus.Successful]: "Epin Purchase Successful 🎉",
  [TransactionStatus.Pending]: "Epin Purchase Pending 😢",
  [TransactionStatus.Failed]: "Epin Purchase Failed 😢",
  [TransactionStatus.Cancelled]: "Epin Purchase Cancelled 😢",
  [TransactionStatus.Initiated]: "Epin Purchase Initiated 😢",
};

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

const airtimeDetailKeys = [
  {
    label: "Recipient",
    key: "phone",
  },
  {
    label: "Reference Number",
    key: "requestId",
  },
  {
    label: "Amount",
    key: "amount",
    formatter: formatToNaira,
  },
];

const dataDetailKeys = [
  {
    label: "Recipient",
    key: "phone",
  },
  {
    label: "Reference Number",
    key: "requestId",
  },
  {
    label: "Amount",
    key: "amount",
    formatter: formatToNaira,
  },
  {
    label: "Data Amount",
    key: "data_amount",
    formatter: formatToNaira,
  },
  {
    label: "Recipient",
    key: "phone",
  },
  {
    label: "Date",
    key: "created_at",
    formatter: formatDate,
  },
];

const getTransactionTitle = (type: TransactionForm, status: TransactionStatus) => {
  const titleMap = {
    [TransactionForm.Airtime]: airtimeTitleMap,
    [TransactionForm.Data]: dataTitleMap,
    [TransactionForm.Electricity]: electricityTitleMap,
    [TransactionForm.CableTv]: cableTitleMap,
    [TransactionForm.Education]: educationTitleMap,
    [TransactionForm.Epin]: epinTitleMap,
  };

  return titleMap[type][status];
};

type Args = {
  details: { [index: string]: string } | null;
  type: TransactionForm;
};

const getTransactionDetails = ({ type, details }: Args) => {
  if (!details) return [];

  switch (type) {
    case TransactionForm.Airtime:
      return airtimeDetailKeys.map((record) => {
        const label = record.label;
        const value = record.formatter ? record.formatter(details[record.key]) : details[record.key];

        return {
          label,
          value,
        };
      });

    case TransactionForm.Data:
      return dataDetailKeys.map((record) => {
        const label = record.label;
        const value = record.formatter ? record.formatter(details[record.key]) : details[record.key];

        return {
          label,
          value,
        };
      });

    default:
      return [];
  }
};

const getTransactionDescription = (type: TransactionForm) => {
  switch (type) {
    case TransactionForm.Airtime:
      return "";
    default:
      return "";
  }
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
      screen: SCREENS.SERVICES,
      params: {
        screen: SCREENS.VIEW_TRANSACTION,
        params: {
          transactionId: transactionId as any,
          type,
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

export {
  getTransactionTitle,
  getTransactionDetails,
  getTransactionDescription,
  airtimeDetailKeys,
  dataDetailKeys,
  defaultTransactionResponse,
  navigateToTransaction,
  formatDate,
};
