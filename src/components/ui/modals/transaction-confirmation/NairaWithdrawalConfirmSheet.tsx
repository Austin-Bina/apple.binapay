import React, { forwardRef } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import BottomSheetModal from "../BottomSheet/BottomSheet";
import tw from "@lib/tailwind";
import { formattedBalance } from "@utils/transactionutils";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
};

type Props = {
  amount: string;
  fee: number;
  amountToReceive: number;
  bankAccount: BankAccount;
  onConfirm: () => void;
  onCancel: () => void;
};

const NairaWithdrawalConfirmSheet = forwardRef<any, Props>(
  ({ amount, fee, amountToReceive, bankAccount, onConfirm, onCancel }, ref) => {
    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Confirm Withdrawal"
        initialSnapPoints={["80%"]}
         index={0} 
        onDismiss={onCancel}
        enableDynamicSizing={false}
      >
        <View style={tw`px-4 pb-6`}>
          {/* Summary */}
          <View style={tw`bg-gray-50 rounded-2xl p-3.5 mb-2.5`}>
            <Text style={tw`mb-1`}>
              Amount: {formattedBalance(amount, "NGN")}
            </Text>
            </View> 
             <View style={tw`bg-gray-50 rounded-2xl p-3.4 mb-2.5`}>
            <Text style={tw`mb-1`}>
              Processing Fee: {formattedBalance(fee, "NGN")}
            </Text>
            </View>

             <View style={tw`bg-gray-50 rounded-2xl p-3.5 mb-2.5`}>
            <Text style={tw`font-semibold`}>
              You will receive: {formattedBalance(amountToReceive, "NGN")}
            </Text>
          </View>

          {/* Bank details */}
          <View style={tw`border border-gray-200 rounded-2xl p-3.5 mb-2.5`}>

            <Text style={tw`font-medium text-gray-900`}>
             Bank: {bankAccount.bank_name}
            </Text>

            </View>
            <View style={tw`border border-gray-200 rounded-2xl p-3.5 mb-2.5`}>
            <Text style={tw`text-gray-700`}>
            Account Number: {bankAccount.account_number}
            </Text>
            </View>

            <View style={tw`border border-gray-200 rounded-2xl p-3.5 mb-2.5`}>
            <Text style={tw`text-gray-500`}>
            Beneficiary: {bankAccount.account_name}
            </Text>
            </View>
          </View>

          {/* Actions */}
          <Button
            mode="contained"
            onPress={onConfirm}
            style={tw`py-3 rounded-2xl mb-3`}
          >
            Confirm Withdrawal
          </Button>

         
      
      </BottomSheetModal>
    );
  }
);

export default NairaWithdrawalConfirmSheet;
