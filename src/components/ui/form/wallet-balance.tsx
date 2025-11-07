import React from "react";
import { View } from "react-native";
import { HelperText } from "react-native-paper";
import tw from "@lib/tailwind";
import { formatToNaira } from "@utils/money";
import { useTypedSelector } from "@store/common";
import { selectNairaBalance } from "@store/selectors/auth";

type Props = {
  canPay: boolean;
  walletError: string | null;
};

export default function WalletBalanceHelper({ canPay, walletError }: Props) {
  const walletBalance = useTypedSelector(selectNairaBalance);

  return (
    <View>
      <HelperText type={canPay ? "info" : "error"} visible style={tw.style(`px-0 text-sm`, canPay && "text-primary-900")}>
        {canPay ? `Wallet Balance: ${formatToNaira(walletBalance)}` : `Wallet Balance: ${formatToNaira(walletBalance)} - ${walletError}`}
      </HelperText>
    </View>
  );
}
