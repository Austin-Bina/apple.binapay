import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import { TransactionForm } from "@enum/transaction";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { route } from "@helpers/route";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { useGetCablePlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import { selectUser } from "@store/selectors/auth";
import { addPendingTransaction, setTransactionError } from "@store/slice/transactionSlice";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, TouchableOpacity } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { z } from "zod";
import VerifiedBadge from "@assets/icons/verified-badge.svg";
import Fuse from "fuse.js";
import { CablePlan } from "@type/app";
import { formatToNaira } from "@utils/money";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { showToast } from "@helpers/toast";
import { AxiosError } from "axios";

type Props = ServicesStackScreenProps<"TV Subscription">;

const MAX_CARD_NUMBER = 10;
const schema = z.object({
  provider: z.string(),
  amount: z.string(),
  smart_card_number: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === MAX_CARD_NUMBER && !isNaN(Number(val)), {
      message: `Must be a ${MAX_CARD_NUMBER}-digit number`,
    }),
  customer_name: z.string(),
  package: z.string(),
  package_name: z.string(),
  phone: z.string(),
  period: z.string(),
});

type FormValues = z.infer<typeof schema>;

const gotvSubPeriods = [
  { label: "Weekly", id: "week" },
  { label: "Monthly", id: "month" },
  { label: "Quarterly (3 Months)", id: "quarter" },
  { label: "Yearly (12 Months)", id: "year" },
];

export default function TVSubscriptionScreen({ navigation }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToPay, setReadyToPay] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [cablePackages, setCablePackages] = useState<CablePlan[]>([]);

  const { data, isLoading } = useGetCablePlansQuery();
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const controllerRef = useRef(new AbortController());

  const { control, watch, reset, setValue, setError, clearErrors, handleSubmit, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      provider: "gotv",
      amount: "0",
      smart_card_number: "",
      period: "month",
      package: "",
      customer_name: "",
      package_name: "",
      phone: user?.phone,
    },
  });

  const values = watch();
  const provider = values.provider;

  useEffect(() => {
    if (!isLoading && data?.cable_plans) {
      const initialPackages = data.cable_plans[provider] || [];
      setCablePackages(initialPackages);
    }
  }, [data, provider, isLoading]);

  const filterPlansByPeriod = useCallback(
    (selectedPeriod: string) => {
      const cablePlans = data?.cable_plans[provider] || [];

      if (!selectedPeriod) {
        return setCablePackages(cablePlans);
      }

      const fuse = new Fuse(cablePlans, {
        keys: ["package"],
        threshold: 0.4,
      });

      const filteredPlans = fuse.search(selectedPeriod).map((result) => result.item);
      setCablePackages(filteredPlans);
    },
    [values.period, data?.cable_plans],
  );

  const validateCard = async () => {
    const { provider, smart_card_number } = values;

    const data = {
      provider,
      smart_card_number,
    };

    trigger(["provider", "smart_card_number"]).then(async (allGood) => {
      if (allGood) {
        try {
          setIsProcessing(true);
          setShowProgress(true);
          setReadyToPay(false);

          setValue("customer_name", "");
          clearErrors(["smart_card_number"]);

          const response = await API.post(route("services.resolveCable"), data, {
            signal: controllerRef.current.signal,
          });

          const { payload } = response.data;

          if (!payload || payload.invalid) {
            setError("smart_card_number", {
              message: "Could not find card number",
            });
          } else {
            setValue("customer_name", payload.name);
            setReadyToPay(true);
          }
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          const { response } = axiosError;

          if (response) {
            const { message, errors } = response.data;

            if (errors) {
              for (const [field, fieldErrors] of Object.entries(errors)) {
                if (Array.isArray(fieldErrors)) {
                  setError(field as keyof FormValues, {
                    message: fieldErrors.join(", "),
                  });
                }
              }

              return showToast({ message });
            }
          }

          dispatch(
            setTransactionError({
              code: "500",
              status: "error",
              title: "Something went wrong",
              description: "We had an error while trying to verify your card number, please try again.",
            }),
          );
        } finally {
          setShowProgress(false);
          setIsProcessing(false);
        }
      }
    });
  };

  const openBottomSheet = useCallback(() => {
    if (!readyToPay) {
      return validateCard();
    }

    bottomSheet.current?.present();
  }, [readyToPay, validateCard]);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    const transaction = {
      id: TransactionForm.CableTv,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));

    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });

    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`flex-1 px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          TV Subscription
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Easily purchase subscriptions for your favorite TV channels. Enter the details below to proceed.
        </Text>
        <View style={tw`flex-row items-center justify-around my-5`}>
          {Object.values(serviceProvidersMap.entertainment).map((provider) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => setValue("provider", provider.key)}
              style={[
                tw`p-3 mb-2 border border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.key && tw`border-blue-500 border-2`,
              ]}>
              <Image source={provider.logo} width={60} height={60} />
            </TouchableOpacity>
          ))}
        </View>
        <View>
          <Controller
            control={control}
            name="smart_card_number"
            render={({ fieldState: { error }, field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Smart-card Number"
                placeholder="Enter Smart-Card Number"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />
          {showProgress && (
            <View style={tw`flex-row items-center gap-2`}>
              <ActivityIndicator animating size="small" aria-label="Reading card number" />
              <Text variant="labelSmall" style={tw`text-xs text-gray-500`}>
                Verifying card number
              </Text>
            </View>
          )}
          {values.customer_name && (
            <View style={tw`flex-row items-center gap-1.5`}>
              <VerifiedBadge />
              <Text variant="titleSmall" style={tw`text-primary-600`}>
                {values.customer_name}
              </Text>
            </View>
          )}
        </View>

        <DropdownMenuField
          label="Period"
          placeholder="Select your period"
          name="period"
          control={control}
          data={gotvSubPeriods}
          onDataSelect={(selectedPeriod) => filterPlansByPeriod(selectedPeriod.id)}
        />
        <DropdownMenuField
          label="Package"
          placeholder="Select your package"
          name="package"
          control={control}
          data={cablePackages.map((plan) => ({
            label: `${plan.package} - ${formatToNaira(plan.plan_amount)}`,
            amount: plan.plan_amount,
            package_name: plan.package,
            id: plan.id.toString(),
          }))}
          onDataSelect={(plan) => {
            reset({
              ...values,
              amount: plan.amount,
              package: plan.id,
              package_name: plan.package_name,
            });
          }}
        />
        <View style={tw`mb-5`}>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>Wallet Balance: {formatToNaira(user?.wallet_balance)}</Text>
        </View>
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          disabled={isProcessing}
          onPress={openBottomSheet}
          mode="contained">
          {!readyToPay ? "Verify" : "Proceed"}
        </Button>
      </View>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={["50%", "50%"]}
        closeFilter={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2`}>
              Confirm Bill Payment
            </Text>
            <View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Network:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image width={30} source={serviceProvidersMap.entertainment[values.provider].logo} />
                  <Text style={tw`text-lg font-bold`}>{serviceProvidersMap.entertainment[values.provider].label}</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>{formatToNaira(values.amount)}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Smart-Card Number:</Text>
                <Text style={tw`text-lg font-bold`}>{values.smart_card_number}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Package:</Text>
                <Text style={tw`text-lg font-bold`}>{values.package_name}</Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={handleMakePayment}
              style={tw`w-full rounded-full mt-[20%]`}
              contentStyle={tw`py-2`}
              labelStyle={tw`text-base`}>
              Make Payment
            </Button>
          </View>
        }
      />
      <PleaseWaitModal visible={isLoading} />
      <TransactionErrorSheet />
    </Screen>
  );
}
