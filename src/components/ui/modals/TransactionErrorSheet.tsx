import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { clearTransactionError, removePendingTransaction } from "@store/slice/transactionSlice";
import React, { useCallback, useEffect, useRef } from "react";
import { Keyboard, View } from "react-native";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { Card, Text } from "react-native-paper";
import tw from "@lib/tailwind";
import { Colors } from "@constants/theme/colors";
import { SadFace } from "@components/icons/svg";

const TransactionErrorSheet = () => {
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
  const dispatch = useTypedDispatch();
  const error = useTypedSelector((state) => state.transaction.error);

  const handleDismiss = useCallback(() => {
    dispatch(clearTransactionError());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss();
      }

      setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [error]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      initialSnapPoints={["50%", "50%"]}
      onDismiss={handleDismiss}
      showHeader
      children={
        <View style={tw`p-4`}>
          <Card mode="contained" style={tw`bg-transparent`}>
            <Card.Content style={tw`items-center`}>
              <View style={tw`justify-center h-16 w-16 items-center p-4 bg-red-50 rounded-3xl mb-2.5`}>
                <SadFace fill={Colors.red[700]} width={30} height={30} />
              </View>
              <Text variant="titleLarge" style={tw`font-medium text-gray-800 text-center my-1`}>
                {error?.title}
              </Text>
              <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
                {error?.description}
              </Text>
            </Card.Content>
          </Card>
        </View>
      }
    />
  );
};

export default TransactionErrorSheet;
