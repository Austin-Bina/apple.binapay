import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useEffect, useState } from "react";
import { View, Keyboard } from "react-native";
import { Text } from "react-native-paper";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { z } from "zod";
import { TransactionForm } from "@enum/transaction";
import { route } from "@helpers/route";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { getPendingTransaction, setTransactionError, updatePendingTransaction } from "@store/slice/transactionSlice";
import { AxiosError } from "axios";

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
  [TransactionForm.Airtime]: route("services.airtime"),
  [TransactionForm.Data]: route("services.data"),
  [TransactionForm.Electricity]: route("services.electricity"),
  [TransactionForm.FUNDING]: "",
  [TransactionForm.TV_SUBSCRIPTION_CHANGE]: "",
  [TransactionForm.CableTv]: route("services.cable"),
  [TransactionForm.EDUCATION]: "",
  [TransactionForm.VIRTUAL_ACCOUNT]: "",
} as const;

export default function TransactionConfirmationScreen({ navigation, route }: Props) {
  const [fetching, setFetching] = useState(false);
  const [trialCount, setTrialCount] = useState(4);

  const dispatch = useTypedDispatch();
  const pendingTransaction = useTypedSelector((state) =>
    getPendingTransaction(state.transaction, route.params.transactionId),
  );

  const { control, watch, reset, setError } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      pin: "",
    },
  });

  const { pin } = watch();
  const { transactionId } = route.params;

  useEffect(() => {
    if (pin.length === maximumLength) {
      Keyboard.dismiss();

      const processTransaction = async () => {
        try {
          setFetching(true);

          const response = await API.post(sources[transactionId], {
            ...pendingTransaction.data,
            pin,
          });

          const result = response.data;
          if (result?.transaction && "details" in result.transaction) {
            dispatch(
              updatePendingTransaction({
                ...pendingTransaction,
                data: {
                  ...pendingTransaction.data,
                  success: {
                    ...result.transaction,
                  },
                },
              }),
            );
          }

          navigation.navigate("Service Purchase Success", route.params);
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          const { response } = axiosError;

          if (response) {
            const result = response.data;

            if (result?.errors?.pin) {
              reset({
                pin: "",
              });
              setError("pin", { message: result.errors.pin[0] });
            } else if (result?.transaction_data) {
              const { remark, description, status, code } = result.transaction_data;
              dispatch(setTransactionError({ code, status, title: remark, description }));
            } else {
              dispatch(
                setTransactionError({
                  code: "500",
                  status: "error",
                  title: "Something went wrong",
                  description: "We could not complete the request, please try again.",
                }),
              );
            }
          }

          navigation.goBack();
        } finally {
          setFetching(false);
        }
      };

      processTransaction();
    }
  }, [pin]);

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Enter PIN</Text>
          <Text style={tw`w-full text-gray-500 font-normal`}>Enter your 4 digit transaction PIN to continue.</Text>
          <View style={tw`my-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput control={control} maximumLength={maximumLength} name="pin" />
            </View>
          </View>
        </View>
      </View>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
}
