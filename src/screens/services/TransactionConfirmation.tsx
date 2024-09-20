import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useEffect, useState } from "react";
import { View, Keyboard } from "react-native";
import { Text } from "react-native-paper";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { z } from "zod";
import { TransactionForm } from "@enum/transaction";
import { route } from "@helpers/route";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { getPendingTransaction, setTransactionError, updatePendingTransaction } from "@store/slice/transactionSlice";
import { AxiosError } from "axios";
import { TransactionResponse } from "@type/transaction";
import { defaultTransactionResponse } from "@helpers/transaction";

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
  [TransactionForm.CableTv]: route("services.cable"),
  [TransactionForm.Education]: route("services.education.purchase"),
  [TransactionForm.Epins]: route("services.epins"),
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

          const result = response.data as TransactionResponse;

          dispatch(
            updatePendingTransaction({
              ...pendingTransaction,
              data: {
                ...pendingTransaction.data,
                response: {
                  ...defaultTransactionResponse,
                  ...result,
                },
              },
            }),
          );

          navigation.navigate("View Transaction", route.params);
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          const { response } = axiosError;

          if (response) {
            const result = response.data;

            if (result?.errors?.pin) {
              return setError("pin", { message: result.errors.pin[0] });
            } else if (result?.transaction_info) {
              const fullResponse = { ...defaultTransactionResponse, ...result };
              dispatch(setTransactionError(fullResponse as TransactionResponse));
            } else {
              dispatch(setTransactionError(defaultTransactionResponse));
            }
          }

          navigation.goBack();
        } finally {
          reset({ pin: "" });
          setFetching(false);
        }
      };

      processTransaction();
    }
  }, [pin]);

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-5`}>
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
