import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import BottomSheetModal from "../BottomSheet/BottomSheet";
import tw from "@lib/tailwind";
import { formattedBalance } from "@utils/transactionutils";

type Props = {
  amount: string;
  fee: number;
  amountToReceive: number;
  walletAddress: string;
  networkName: string;
  asset: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const CryptoWithdrawalConfirmSheet = forwardRef<any, Props>(
  ({ amount, fee, asset, amountToReceive, walletAddress, networkName, onConfirm, onCancel }, ref) => {
    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Confirm Withdrawal"
        initialSnapPoints={["75%"]}
        index={0}
        onDismiss={onCancel}
        enableDynamicSizing={false}
      >
        <View style={tw`px-4 pb-6`}>

           <View style={tw`bg-gray-50 rounded-2xl p-4 mb-2.5`}>
            <Text>Asset: {asset}</Text>
          </View>

           <View style={tw`bg-gray-50 rounded-2xl p-4 mb-2.5`}>
            <Text>Network: {networkName}</Text>
          </View>

          <View style={tw`bg-gray-50 rounded-2xl p-4 mb-2.5`}>
            <Text>Amount: {formattedBalance(amount, "")}</Text>
          </View>

          <View style={tw`bg-gray-50 rounded-2xl p-4 mb-2.5`}>
            <Text>Network Fee: {formattedBalance(fee, "")}</Text>
          </View>

          <View style={tw`bg-gray-50 rounded-2xl p-4 mb-2.5`}>
            <Text style={tw`font-semibold`}>
              You will receive: {formattedBalance(amountToReceive, "")}
            </Text>
          </View>

          <View style={tw`border border-gray-200 rounded-2xl p-4 mb-2.5`}>
            <Text style={tw`font-medium text-gray-900`}>
              Wallet Address: {walletAddress}
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={onConfirm}
            style={tw`py-3 rounded-2xl mb-3`}
          >
            Confirm Withdrawal
          </Button>
         
        </View>
      </BottomSheetModal>
    );
  }
);

export default CryptoWithdrawalConfirmSheet;
