import { TransactionStatus } from "@enum/transaction";
import tw from "@lib/tailwind";

export const getStatusColor = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.Pending:
      return tw`bg-yellow-100 text-yellow-800`;
    case TransactionStatus.Failed:
      return tw`bg-red-100 text-red-800`;
    case TransactionStatus.Successful:
      return tw`bg-green-100 text-green-800`;
    case TransactionStatus.Cancelled:
      return tw`bg-gray-100 text-gray-800`;
    case TransactionStatus.Initiated:
      return tw`bg-blue-100 text-blue-800`;
    case TransactionStatus.Refunded:
      return tw`bg-purple-100 text-purple-800`;
    default:
      return tw`bg-gray-100 text-gray-800`;
  }
};

export const getStatusLabel = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.Pending:
      return "Processing";
    case TransactionStatus.Failed:
      return "Failed";
    case TransactionStatus.Successful:
      return "Successful";
    case TransactionStatus.Cancelled:
      return "Cancelled";
    case TransactionStatus.Initiated:
      return "Started";
    case TransactionStatus.Refunded:
      return "Refunded";
    default:
      return status;
  }
};

export const getStatusIconName = (status: TransactionStatus) => {
  switch (status) {
    case TransactionStatus.Pending:
      return "clock-outline";
    case TransactionStatus.Failed:
      return "close-circle-outline";
    case TransactionStatus.Successful:
      return "checkmark-circle-outline";
    case TransactionStatus.Cancelled:
      return "ban-outline";
    case TransactionStatus.Initiated:
      return "arrow-forward-circle-outline";
    case TransactionStatus.Refunded:
      return "cash-refund";
    default:
      return "help-circle-outline";
  }
}; 
