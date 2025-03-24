import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  RefreshControl,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  View,
} from "react-native";
import { Appbar, Button, useTheme, Text } from "react-native-paper";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { History, Wallet } from "lucide-react-native";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { TransactionForm } from "@enum/transaction";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { useGetDataPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { selectSystemSettings } from "@store/selectors/settings";
import { serviceProvidersMap } from "@constants/providers";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { calculateTransactionDetails } from "@utils/money";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { usePhoneValidation } from "@hooks/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import ScrollableView from "@components/ui/shared/ScrollableView";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import ContactPickerModal from "@components/ui/modals/pick-contacts";
import {
  NetworkPhoneInput,
  DataTypesSelection,
  DataBundlesGrid,
  PaymentSection,
} from "@components/services/data-purchase";
import { InternetProviders } from "@type/app";

type Props = ServicesStackScreenProps<"Data Purchase">;

const schema = z.object({
  provider: z.string().min(3),
  phone: zodPhoneValidation,
  data_bundle: z.number().optional(),
  data_amount: z.string(),
  amount: z.string(),
  type: z.string(),
  vendor: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function DataPurchaseScreen({ navigation }: Props) {
  const theme = useTheme();
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  // Redux state
  const user = useTypedSelector(selectUser);
  const { customers, transaction } = useTypedSelector(selectSystemSettings);
  const dispatch = useTypedDispatch();

  // API queries
  const {
    data: queryData,
    isFetching,
    isError,
    refetch,
  } = useGetDataPlansQuery();

  const prefetchSystemSettings = useSystemSettingsPrefetch(
    "getSystemSettings",
    { ifOlderThan: MAX_CACHE_AGE_SEC }
  );

  // Form setup
  const {
    control,
    watch,
    trigger,
    clearErrors,
    setError,
    reset,
    setValue,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: getDefaultProvider(user?.phone),
      phone: user?.phone,
      data_bundle: undefined,
      data_amount: "",
      amount: "0",
      type: "",
      vendor: "",
    },
    mode: "onChange",
  });

  const values = watch();
  const provider = values.provider as InternetProviders;

  // Hook for phone validation
  const revalidatePhone = usePhoneValidation({
    phone: values.phone,
    provider: values.provider,
    portedNumber: true,
    setError,
    clearErrors,
  });

  // Hook for wallet balance validation
  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  // Fetch system settings on mount
  useEffect(() => {
    prefetchSystemSettings();
  }, [prefetchSystemSettings]);

  const dataProviders = useMemo(
    () =>
      Object.values(serviceProvidersMap.internet).filter((p) =>
        transaction.data.networks.includes(p.serviceId)
      ),
    [transaction.data]
  );

  const dataTypes = useMemo(() => {
    const allTypes = queryData?.popular_data_types || [];

    const supportedPopularTypes = allTypes.filter(
      (type) =>
        !type.supported_networks ||
        type.supported_networks
          .map((n) => n.toUpperCase())
          .includes(provider.toUpperCase())
    );

    const types = supportedPopularTypes.map((type) => ({
      id: type.type,
      label: type.name,
    }));

    return types;
  }, [queryData, provider]);

  const dataPlans = useMemo(() => {
    const plans = queryData?.data_plans[provider] || [];
    const type = values.type;

    return plans
      .filter((plan) => (!!type ? plan.plan_type === type : true))
      .map((plan) => {
        const planAmount = parseFloat(plan.plan_amount);

        return {
          ...plan,
          label: `${plan.plan} - ${planAmount} ${plan.month_validate}`,
          amount: plan.plan_amount,
          data_amount: plan.plan,
          data_bundle: plan.id,
          type: plan.plan_type,
          vendor: plan.vendor,
          month_validate: plan.month_validate,
        };
      });
  }, [queryData, values.provider, values.type]);

  // Auto-select first data type when data is loaded or provider changes
  useEffect(() => {
    if (dataTypes.length > 0 && !values.type) {
      setValue("type", dataTypes[0].id);
    }
  }, [dataTypes, setValue, values.type]);

  const transactionDetails = useMemo(() => {
    const extraPlanDetails = calculateTransactionDetails(
      parseFloat(values.amount) || 0,
      "data",
      customers
    );

    return [
      {
        label: "Network",
        value: values.provider,
        icon: serviceProvidersMap.internet[values.provider]?.logo,
      },
      { label: "Data Amount", value: values.data_amount },
      { label: "Number", value: values.phone },
      ...Object.keys(extraPlanDetails).map((key) => ({
        label: key,
        value: extraPlanDetails[key],
      })),
    ];
  }, [
    values.provider,
    values.data_amount,
    values.phone,
    values.amount,
    customers,
  ]);

  // Handlers
  const onRefresh = useCallback(() => {
    if (!isFetching) {
      refetch();
      prefetchSystemSettings();
    }
  }, [isFetching, refetch, prefetchSystemSettings]);

  const handleSelectBundle = useCallback(
    (plan: any) => {
      reset({
        ...values,
        data_bundle: plan.data_bundle,
        data_amount: plan.data_amount,
        amount: plan.amount,
        vendor: plan.vendor,
      });
    },
    [reset, values]
  );

  const handleSelectContact = useCallback(
    (phoneNumber: string) => {
      reset({
        ...values,
        phone: phoneNumber,
        provider: getDefaultProvider(phoneNumber),
      });
    },
    [values, reset]
  );

  const openBottomSheet = useCallback(async () => {
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => bottomSheet.current?.present(), 100);
    }
  }, [trigger]);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const navigateToTransactionHistory = useCallback(async () => {
    const { navigate } = await getNavigate();
    navigate("Main", {
      screen: SCREENS.HOME,
      params: { screen: SCREENS.TRANSACTION_HISTORY },
    });
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    if (!revalidatePhone()) return;

    const transaction = {
      id: TransactionForm.Data,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));
    closeBottomSheet();
    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });
  });

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <SafeAreaView style={tw`flex-1`}>
        <Appbar.Header style={tw`bg-white`}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Buy Data Bundle"
            titleStyle={tw`text-lg font-bold text-gray-800`}
          />
          <Appbar.Action
            icon={() => <History size={24} color={theme.colors.primary} />}
            onPress={navigateToTransactionHistory}
            rippleColor="transparent"
          />
        </Appbar.Header>

        <ScrollableView
          contentContainerStyle={tw`pb-24 px-4`}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
          }
        >
          {/* Network Provider & Phone Input - Side by side */}
          <NetworkPhoneInput
            control={control}
            watch={watch}
            reset={reset}
            dataProviders={dataProviders}
            onOpenContactModal={() => setIsContactModalVisible(true)}
          />

          {/* Data Type Selection */}
          <DataTypesSelection
            dataTypes={dataTypes}
            selectedType={values.type}
            onTypeSelect={(type) => {
              reset({
                ...values,
                type,
                data_bundle: undefined,
                data_amount: "",
                amount: "0",
              });
            }}
          />

          {/* Data Bundles Grid - Moved up */}
          <DataBundlesGrid
            dataPlans={dataPlans}
            selectedBundle={values.data_bundle}
            isFetching={isFetching}
            isError={isError}
            onSelectBundle={handleSelectBundle}
            onRetry={onRefresh}
          />

          {/* Payment Information */}
          <PaymentSection
            control={control}
            dataAmount={values.data_amount}
            walletValidation={walletValidation}
          />
        </ScrollableView>

        {/* Fixed bottom button */}
        <SafeAreaView style={tw`bg-white border-t border-gray-200`}>
          <View style={tw`px-4 py-3`}>
            <Button
              style={tw`rounded-full border`}
              contentStyle={tw`py-2`}
              disabled={
                !walletValidation.canPay ||
                dataProviders.length === 0 ||
                !isValid
              }
              labelStyle={tw`text-white text-base font-semibold`}
              onPress={openBottomSheet}
              mode="contained"
              icon={({ size, color }) => (
                <Wallet size={18} color={color} style={tw`mr-1`} />
              )}
            >
              Proceed to Payment
            </Button>
          </View>
        </SafeAreaView>
      </SafeAreaView>

      {/* Modals */}
      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Data Bundle Purchase"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={["60%", "60%"]}
        disabled={!walletValidation.canPay}
      />

      <ContactPickerModal
        index={1}
        isVisible={isContactModalVisible}
        onClose={() => setIsContactModalVisible(false)}
        onSelectContact={handleSelectContact}
      />

      <TransactionErrorSheet />
    </KeyboardAvoidingView>
  );
}
