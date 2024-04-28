import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Keyboard } from "react-native";
import { Card, Text } from "react-native-paper";
import SadFaceIcon from "@assets/icons/sad-face.svg";
import { Colors } from "@constants/theme";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { verticalScale } from "react-native-size-matters";

type Props = ServicesStackScreenProps<"Confirm Transaction">;

const maximumLength = 4;

export default function TransactionConfirmationScreen({
  navigation,
  route,
}: Props) {
  const [token, setToken] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [trialCount, setTrialCount] = useState(4);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  useEffect(() => {
    setErrorMessage("");
    if (token.length === maximumLength) {
      setPinReady(true);
      Keyboard.dismiss();

      if (token === "0000") {
        openBottomSheet();
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
        return;
      }

      if (token === "1234") {
        setFetching(true);

        setTimeout(() => {
          setFetching(false);
          navigation.navigate("Service Purchase Success", route.params);
        }, 3000);
      } else {
        setErrorMessage(
          `Invalid PIN, you have ${trialCount} trials remaining.`
        );
        setTrialCount((prevCount) => prevCount - 1);
        if (trialCount === 0) {
          setTimeout(() => {
            navigation.goBack();
          }, 2000);
        }
      }
    }
  }, [token]);

  const openBottomSheet = useCallback(() => {
    bottomSheet.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheet.current?.dismiss();
    console.log("Closed");
  }, []);

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Enter PIN
          </Text>
          <Text style={tw`w-full text-gray-500 font-normal`}>
            Enter your 4 digit transaction PIN to continue.
          </Text>
          {errorMessage && (
            <Text style={tw`text-red-500 text-sm mb-2`}>{errorMessage}</Text>
          )}
          <View style={tw`my-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput
                code={token}
                maximumLength={maximumLength}
                setCode={setToken}
              />
            </View>
          </View>
        </View>
      </View>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={["50%", "50%"]}
        closeFilter={handleClose}
        children={
          <View style={tw`p-4`}>
            <Card mode="contained" style={tw`bg-transparent`}>
              <Card.Content style={tw`items-center`}>
                <View
                  style={tw`justify-center h-16 w-16 items-center p-4 bg-red-50 rounded-3xl mb-2.5`}
                >
                  <SadFaceIcon fill={Colors.red[700]} width={30} height={30} />
                </View>
                <Text
                  variant="titleLarge"
                  style={tw`font-medium text-gray-800 text-center my-1`}
                >
                  Insufficient Account Balance
                </Text>
                <Text variant="bodyLarge" style={tw`text-gray-500 text-center`}>
                  It seems like there is not enough balance in your BinaPay
                  wallet to complete this transaction.
                </Text>
              </Card.Content>
            </Card>
          </View>
        }
      />
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
}
