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
import { View, TouchableOpacity, Keyboard, RefreshControl, Text, StyleSheet } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator } from "react-native-paper";
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
import Banner from "@components/ui/banner";
import { zodPhoneValidation } from "@utils/phone";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

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
  vendor: z.string().optional(),
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
      vendor: queryData?.vendor,
    },
  });

  const values = watch();
  const provider = values.provider;

  useEffect(() => {
    setValue("vendor", queryData?.vendor);
  }, [queryData?.vendor]);

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
    const chargePercentage = customers.cable_charge_percentage;
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
<View style={s.root}>
      <ScreenHeader
        title="Pay TV Subscription"
        subtitle="Quick and easy subscription payment"
        onBack={() => navigation.goBack()}
        rightIcon="lightning-bolt"
      />

      
      <ScrollableView
        contentContainerStyle={tw`px-4 py-5`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        <View>
          {/* Provider selector */}
          <View style={s.providerRow}>
            {Object.values(serviceProvidersMap.entertainment).map((providerOption) => (
              <TouchableOpacity
                key={providerOption.serviceId}
                onPress={() => onSelectProvider(providerOption.serviceId)}
                style={[
                  s.providerCard,
                  values.provider === providerOption.serviceId && s.providerCardActive,
                ]}
                activeOpacity={0.8}
              >
                <Image source={providerOption.logo} width={48} height={48} />
              </TouchableOpacity>
            ))}
          </View>

          {isError && !isFetching && (
            <View style={s.errorBanner}>
              <Text style={s.errorBannerText}>We had trouble loading your data plans. Please try again.</Text>
              <TouchableOpacity onPress={onRefresh} style={s.errorBannerBtn}>
                <Text style={s.errorBannerBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form card */}
          <View style={s.card}>
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
              <View style={s.progressRow}>
                <ActivityIndicator animating size="small" color={BLUE} aria-label="Reading card number" />
                <Text style={s.progressText}>Verifying card number</Text>
              </View>
            )}

            {values.customer_name && (
              <View style={s.verifiedRow}>
                <VerifiedBadge />
                <Text style={s.verifiedText}>{values.customer_name}</Text>
              </View>
            )}

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

            <View style={s.amountWrap}>
              <NairaInput name="plan_amount" control={control} isDisabled />
              <WalletBalanceHelper {...walletValidation} />
            </View>
          </View>
        </View>
      </ScrollableView>

      {/* Footer button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.btn, (isProcessing || !walletValidation.canPay) && s.btnDisabled]}
          onPress={openBottomSheet}
          disabled={isProcessing || !walletValidation.canPay}
          activeOpacity={0.85}
        >
          <View style={s.btnInner}>
            <MaterialCommunityIcons
              name={!readyToPay ? "shield-check-outline" : "arrow-right-circle-outline"}
              size={20}
              color="#fff"
            />
            <Text style={s.btnText}>{!readyToPay ? "Verify" : "Proceed"}</Text>
          </View>
        </TouchableOpacity>
      </View>

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
    </View>
   
  

  );
}

const s = StyleSheet.create({
   root:   { flex: 1, backgroundColor: "#f8f9fb" },
  header:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerText:      { flex: 1 },
  headerTitle:     { fontSize: 17, fontWeight: "800", color: BRAND },
  headerSub:       { fontSize: 12, color: "#6b7280", marginTop: 2 },

  providerRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 16 },
  providerCard:    { padding: 12, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  providerCardActive: { borderColor: BLUE, borderWidth: 2, backgroundColor: "#EEF3FF" },

  errorBanner:     { backgroundColor: "#fef2f2", padding: 14, borderRadius: 12, marginBottom: 16 },
  errorBannerText: { fontSize: 13, color: "#374151" },
  errorBannerBtn:  { marginTop: 6, alignSelf: "flex-start" },
  errorBannerBtnText: { fontSize: 13, fontWeight: "700", color: BLUE },

  card:            { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 4 },

  progressRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  progressText:    { fontSize: 12, color: "#6b7280" },

  verifiedRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  verifiedText:    { fontSize: 14, fontWeight: "700", color: BLUE },

  amountWrap:      { marginTop: 8 },

  footer:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:             { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:     { opacity: 0.45 },
  btnInner:        { flexDirection: "row", alignItems: "center", gap: 8 },
  btnText:         { fontSize: 16, fontWeight: "700", color: "#fff" },
});
