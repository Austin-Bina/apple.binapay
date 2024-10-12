import { env } from "@env";
import { BinaNotification } from "@type/app";
import { UtilityTransaction, WalletTransaction } from "@type/transaction";
import { format } from "date-fns";
import { P, match } from "ts-pattern";

const upperCaseFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatSecondsToDate = (seconds: number | string) => {
  const stringTime = seconds.toString();

  if (isNaN(parseInt(stringTime, 10))) {
    throw new Error("Invalid seconds");
  }

  const date = new Date(parseInt(stringTime, 10) * 1000);
  return format(date, "dd MMM yyyy, hh:mm a");
};

const truncateString = (str: string = "", maxLength: number) => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

export const getTransactionIcon = (transaction: WalletTransaction | UtilityTransaction | null) => {
  const transactionIcon = match(transaction)
    .with(
      {
        payment_transaction: {
          utilityTransaction: {
            provider_logo: P.string,
          },
        },
      },
      ({
        payment_transaction: {
          utilityTransaction: { provider_logo },
        },
      }) => provider_logo,
    )
    .with(
      {
        payment_transaction: {
          utilityTransaction: {
            details: {
              provider: P.string,
            },
          },
        },
      },
      ({
        payment_transaction: {
          utilityTransaction: {
            details: { provider },
          },
        },
      }) => `${env.BASE_URL}/assets/images/services/${provider}.png`,
    )
    .with({ type: P.string }, ({ type }) => `${env.BASE_URL}/assets/icons/notifications/${type}.png`)
    // begin utility transaction check
    .with({ provider_logo: P.string }, (utilityTransaction) => {
      if (utilityTransaction.provider_logo) {
        return utilityTransaction.provider_logo;
      }
      return `${env.BASE_URL}/assets/images/services/${utilityTransaction.details.provider}.png`;
    })
    .otherwise(() => `${env.BASE_URL}/assets/icons/notifications/system.png`);

  return transactionIcon;
};

const debounce = (fn: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

export { upperCaseFirst, formatSecondsToDate, truncateString, debounce };
