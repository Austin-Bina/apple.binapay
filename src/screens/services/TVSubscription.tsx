import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
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
import { addPendingTransaction } from "@store/slice/transactionSlice";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, TouchableOpacity, Keyboard, RefreshControl } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { z } from "zod";
import VerifiedBadge from "@assets/icons/verified-badge.svg";
import Fuse from "fuse.js";
import { calculateTransactionDetails, formatToNaira } from "@utils/money";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { showToast } from "@helpers/toast";
import { AxiosError } from "axios";
import { useWalletBalanceValidation } from "@hooks/transaction";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { selectSystemSettings } from "@store/selectors/settings";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import { Colors } from "@constants/theme/colors";
import Banner from "@components/ui/banner";
import { zodPhoneValidation } from "@utils/phone";

type Props = ServicesStackScreenProps<"TV Subscription">;

const MAX_CARD_NUMBER = 10;
const schema = z.object({
  provider: z.string(),
  amount: z.string().trim(),
  smart_card_number: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === MAX_CARD_NUMBER && !isNaN(Number(val)), {
      message: `Must be a ${MAX_CARD_NUMBER}-digit number`,
    }),
  customer_name: z.string(),
  package: z.string(),
  package_name: z.string(),
  phone: zodPhoneValidation,
  period: z.string(),
});

type FormValues = z.infer<typeof schema>;

const cableSubPeriods = [
  { label: "All", id: "all" },
  { label: "Weekly", id: "week" },
  { label: "Monthly", id: "month" },
  { label: "Quarterly (3 Months)", id: "quarter" },
  { label: "Yearly (12 Months)", id: "year" },
];

export default function TVSubscriptionScreen({ navigation }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToPay, setReadyToPay] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const { customers } = useTypedSelector(selectSystemSettings);
  const {
    data: queryData,
    isFetching,
    isError,
    refetch,
  } = useGetCablePlansQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

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
      period: "all",
      package: "",
      customer_name: "",
      package_name: "",
      phone: user?.phone,
    },
  });

  const values = watch();
  const provider = values.provider;

  useEffect(() => {
    prefetchSystemSettings();
  }, []);

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  useEffect(() => {
    if (readyToPay && values.smart_card_number) {
      setReadyToPay(false);
      setValue("customer_name", "");
    }
  }, [values.smart_card_number]);

  const cablePackages = useMemo(() => {
    const chargePercentage = customers.cable_discount_percentage;
    const plans = queryData?.cable_plans[provider] || [];
    const selectedPeriod = values.period;

    const chargedPlans = plans.map((plan) => {
      const planId = plan.id.toString();

      const planAmount = parseFloat(plan.plan_amount);
      const chargeAmount = (chargePercentage / 100) * planAmount;
      const newPrice = planAmount + chargeAmount;

      return {
        id: planId,
        plan_amount: newPrice,
        label: `${plan.package} - ${formatToNaira(plan.plan_amount)}`,
        amount: plan.plan_amount,
        package_name: plan.package,
        package: planId,
      };
    });

    // Filters will come last
    if (!selectedPeriod) {
      return chargedPlans;
    }

    if (selectedPeriod === "all") {
      return chargedPlans;
    }

    const fuse = new Fuse(chargedPlans, {
      keys: ["package_name"],
      threshold: 0.4,
    });

    const filteredPlans = fuse.search(selectedPeriod).map((result) => result.item);
    return filteredPlans;
  }, [queryData, values.period, provider]);

  const extraPlanDetails = useMemo(() => {
    return calculateTransactionDetails(parseFloat(values.amount) || 0, "cable", customers);
  }, [values.amount, customers]);

  const snapSize = "58%";

  const onSelectProvider = useCallback(
    (serviceId: string) => {
      reset({
        ...values,
        provider: serviceId,
        period: "all",
        customer_name: "",
        package_name: "",
        package: "",
        amount: "0",
      });
    },
    [values],
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
              message: "Could not find that card number",
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
        } finally {
          setShowProgress(false);
          setIsProcessing(false);
        }
      }
    });
  };

  const openBottomSheet = useCallback(async () => {
    if (!readyToPay) {
      return validateCard();
    }

    const valid = await trigger();

    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => {
        bottomSheet.current?.present();
      }, 100);
    }
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

  const onRefresh = async () => {
    if (!isFetching) {
      refetch();
      prefetchSystemSettings();
    }
  };

  const transactionDetails = [
    {
      label: "Network",
      value: values.provider,
      icon: serviceProvidersMap.entertainment[values.provider].logo,
    },
    { label: "Smart-Card Number", value: values.smart_card_number },
    { label: "Package", value: values.package_name },
    ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
  ];

  return (
    <Screen>
      <ScrollableView
        contentContainerStyle={tw`justify-between px-4 py-5`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            TV Subscription
          </Text>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            Easily purchase subscriptions for your favorite TV channels. Enter the details below to proceed.
          </Text>
          <View style={tw`flex-row items-center justify-around my-5`}>
            {Object.values(serviceProvidersMap.entertainment).map((provider) => (
              <TouchableOpacity
                key={provider.serviceId}
                onPress={() => onSelectProvider(provider.serviceId)}
                style={[
                  tw`p-3 mb-2 border border-primary-100 rounded-xl justify-center items-center`,
                  values.provider === provider.serviceId && tw`border-blue-500 border-2`,
                ]}>
                <Image source={provider.logo} width={60} height={60} />
              </TouchableOpacity>
            ))}
          </View>

          {isError && !isFetching && (
            <View style={tw`bg-red-50 p-4 rounded-lg items-start`}>
              <Text variant="bodySmall">We had trouble loading your data plans. Please try again.</Text>
              <Button onPress={onRefresh} textColor={Colors.primary[500]}>
                Try again
              </Button>
            </View>
          )}

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
            data={cableSubPeriods}
          />
          <DropdownMenuField
            label="Package"
            placeholder={cablePackages.length === 0 ? "No packages available" : "Select your package"}
            name="package"
            control={control}
            data={cablePackages}
            onDataSelect={(plan) => {
              reset({
                ...values,
                ...plan,
              });
            }}
          />
          <View style={tw`mb-5`}>
            <NairaInput name="amount" control={control} isDisabled />
            <WalletBalanceHelper {...walletValidation} />
          </View>
        </View>

        <Banner
          style={tw`mb-10`}
          content={`You get ${customers.cable_discount_percentage}% off when you purchase your TV subscriptions with us`}
        />

        <View style={tw`pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            labelStyle={tw`text-white text-center text-base font-bold`}
            disabled={isProcessing || !walletValidation.canPay}
            onPress={openBottomSheet}
            mode="contained">
            {!readyToPay ? "Verify" : "Proceed"}
          </Button>
        </View>
      </ScrollableView>

      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Bill Payment"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={[snapSize, snapSize]}
        disabled={!walletValidation.canPay}
      />
      <PleaseWaitModal visible={isFetching} />
      <TransactionErrorSheet />
    </Screen>
  );
}
