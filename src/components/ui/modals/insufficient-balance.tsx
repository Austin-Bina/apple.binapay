import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { Button, Card, Text } from "react-native-paper";
import tw from "@lib/tailwind";
import { Colors } from "@constants/theme/colors";
import { SadFace } from "@components/icons/svg";
import { settingsSliceActions } from "@store/slice/settings";
import { getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";
import { clearTransactionError, removePendingTransaction } from "@store/slice/transactionSlice";

export default function InsufficientBalanceModal() {
  const [wait, setWait] = useState(false);

  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);
  const dispatch = useTypedDispatch();

  const systemError = useTypedSelector((state) => state.settings.error);

  const handleDismiss = useCallback(async () => {
    await Promise.all([
      dispatch(removePendingTransaction()),
      dispatch(clearTransactionError()),
      dispatch(settingsSliceActions.clearApplicationError()),
    ]);
  }, [dispatch]);

  const openBottomSheet = useCallback(() => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
    }

    setTimeout(() => {
      bottomSheetRef.current?.present();
    }, 100);
  }, []);

  const handleFundNavigation = useCallback(async () => {
    setWait(true);
    await handleDismiss();

    const { navigate } = await getNavigate();

    setWait(false);

    setTimeout(() => {
      navigate(SCREENS.MAIN, {
        screen: SCREENS.HOME,
        params: {
          screen: SCREENS.ADD_MONEY,
          params: {
            screen: SCREENS.FUND_WITH_BANK,
          },
        },
      });
    }, 100); // Wait for the animation to finish
  }, [handleDismiss]);

  useEffect(() => {
    // Check if the system error has the error code "client_insufficient_funds"
    if (systemError?.code === "client_insufficient_funds") {
      return openBottomSheet();
    }
  }, [systemError]);

  if (!systemError) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      initialSnapPoints={["50%", "50%"]}
      onDismiss={handleDismiss}
      children={
        <View style={tw`p-4`}>
          <Card mode="contained" style={tw`bg-transparent`}>
            <Card.Content style={tw`items-center`}>
              <View style={tw`justify-center h-16 w-16 items-center p-4 bg-red-50 rounded-3xl mb-2.5`}>
                <SadFace fill={Colors.red[700]} width={30} height={30} />
              </View>
              <Text variant="titleLarge" style={tw`font-medium text-gray-800 text-center my-1`}>
                Insufficient Account Balance
              </Text>
              <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
                It seems like there is not enough balance in your BinaPay wallet to complete this transaction.
              </Text>
            </Card.Content>
          </Card>
          <Button
            mode="contained"
            onPress={handleFundNavigation}
            style={tw`w-full rounded-full mt-10`}
            contentStyle={tw`py-2`}
            disabled={wait}
            labelStyle={tw`text-base`}>
            Fund Wallet
          </Button>
        </View>
      }
    />
  );
}
