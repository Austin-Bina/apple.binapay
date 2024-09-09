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
import { z } from "zod";
import { TransactionForm } from "@enum/transaction";
import { route } from "@helpers/route";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { useTypedSelector } from "@store/common";
import { getPendingTransaction } from "@store/slice/transactionSlice";
import { showToast } from "@helpers/toast";

type Props = ServicesStackScreenProps<"Confirm Transaction">;

const maximumLength = 4;

const schema = z.object({
  pin: z
    .string()
    .transform((val) => {
      const numericValue = val.slice(0, maximumLength);
      return numericValue;
    })
    .refine((val) => /^[0-9]+$/.test(val), {
      message: "PIN must only contain numbers",
    }),
});

const sources = {
  [TransactionForm.AIRTIME_PURCHASE]: route("services.airtime.process"),
  [TransactionForm.DATA_PURCHASE]: "",
  [TransactionForm.BILL_PAYMENT]: "",
  [TransactionForm.FUNDING]: "",
  [TransactionForm.TV_SUBSCRIPTION_CHANGE]: "",
  [TransactionForm.TV_SUBSCRIPTION_RENEW]: "",
  [TransactionForm.EDUCATION]: "",
  [TransactionForm.VIRTUAL_ACCOUNT]: "",
} as const;

export default function TransactionConfirmationScreen({
  navigation,
  route,
}: Props) {
  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [trialCount, setTrialCount] = useState(4);

  const pendingTransaction = useTypedSelector((state) =>
    getPendingTransaction(state.transaction, route.params.transactionId)
  );

  const { control, watch, reset, handleSubmit, setError } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      pin: "",
    },
  });

  const { pin } = watch();

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const { transactionId } = route.params;

  useEffect(() => {
    setErrorMessage("");
    if (pin.length === maximumLength) {
      setPinReady(true);
      setFetching(true);

      Keyboard.dismiss();

      API.post(sources[transactionId], {
        ...pendingTransaction.data,
        pin,
      })
        .then((response) => {
          navigation.navigate("Service Purchase Success", route.params);

          const result = response.data;

          if (result.transaction_data) {
            const { transaction_data } = result as any;
            if (transaction_data.code < 200 || transaction_data.code > 300) {
              reset({
                pin: "",
              });

              setTimeout(() => {
                navigation.goBack();
              }, 2000);

              return;

              // onResponse({
              //   error: {
              //     order_error: true,
              //     title: "Failed to complete order",
              //     description: transaction_data.remark,
              //     status: transaction_data.status,
              //   },
              // });
            }
          }
        })
        .catch((err) => {
          const result = err.response?.data;
          setFetching(false);

          if (result.errors.pin) {
            setError("pin", { message: err.errors.pin[0] });
          }

          if (result && result.transaction_data) {
            const { remark, code, status } = result.transaction_data;

            if (status === "INSUFFICIENT_FUNDS") {
              openBottomSheet();
            } else {
              reset({
                pin: "",
              });
              // Show error
              // back
              // onResponse({ error: err }); add transaction_error
              showToast({ message: remark });
              navigation.goBack();
            }
          }
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [pin]);

  const openBottomSheet = useCallback(() => {
    bottomSheet.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    bottomSheet.current?.dismiss();
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
                control={control}
                maximumLength={maximumLength}
                name="pin"
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
