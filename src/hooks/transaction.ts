import { useTypedSelector } from "@store/common";
import { selectUserWalletBalance } from "@store/selectors/auth";
import { useEffect, useCallback, useState } from "react";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import generateHTMLContent from "@templates/view-transaction-tempate";
import { PrintProps } from "@type/app";

type ShareTransactionReceiptArgs = {
  pageData: PrintProps;
};

const useShareTransactionReceipt = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printingError, setPrintingError] = useState<string | null>(null);

  const shareTransactionReceipt = useCallback(async ({ pageData }: ShareTransactionReceiptArgs) => {
    setIsPrinting(true);
    setIsCompleted(false);
    setPrintingError(null);

    const html = generateHTMLContent(pageData);

    try {
      const { uri } = await Print.printToFileAsync({
        html,
      });

      await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
      setIsCompleted(true);
    } catch (error) {
      console.error("Error printing document:", error);
      setPrintingError("Failed to print document, please try again");
    } finally {
      setIsPrinting(false);
    }
  }, []);

  return {
    shareTransactionReceipt,
    isCompleted,
    isPrinting,
    printingError,
    stopSharing: () => {
      setIsCompleted(false);
      setIsPrinting(false);
      setPrintingError(null);
    },
  };
};

interface WalletBalanceValidationHook {
  amount: number;
}

const useWalletBalanceValidation = ({ amount }: WalletBalanceValidationHook) => {
  const [canPay, setCanPay] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  const walletBalance = useTypedSelector(selectUserWalletBalance);

  const validateBalance = useCallback(() => {
    if (amount > walletBalance) {
      setWalletError("Insufficient funds");
      setCanPay(false);
    } else {
      setWalletError(null);
      setCanPay(true);
    }
  }, [amount, walletBalance]);

  useEffect(() => {
    validateBalance();
  }, [amount, validateBalance]);

  return { canPay, walletError };
};

export { useWalletBalanceValidation, useShareTransactionReceipt };
