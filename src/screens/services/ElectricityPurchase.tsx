import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View, StyleSheet, TouchableOpacity } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { z } from "zod";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { serviceProvidersMap } from "@constants/providers";
import { METER_TYPE } from "@enum/providers";
import { calculateTransactionDetails, zodAmountValidation } from "@utils/money";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { TransactionForm } from "@enum/transaction";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { AxiosError } from "axios";
import { selectSystemSettings } from "@store/selectors/settings";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import { useWalletBalanceValidation } from "@hooks/transaction";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import { zodPhoneValidation } from "@utils/phone";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = ServicesStackScreenProps<"Electricity Bill">;

const MIN_PAYMENT_AMOUNT = 1000;
const schema = z.object({
  provider: z.string(),
  meter_type: z.nativeEnum(METER_TYPE),
  meter_number: z
    .string()
    .trim()
    .min(10, "Please enter a valid meter number")
    .transform((val) => val.replace(/\D/g, "")),
  amount: zodAmountValidation(MIN_PAYMENT_AMOUNT, true),
  customer_name: z.string(),
  customer_address: z.string(),
  phone: zodPhoneValidation,
});

type FormValues = z.infer<typeof schema>;

export default function ElectricityPurchaseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToPay, setReadyToPay]     = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const user     = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const bottomSheet    = useRef<BottomSheetModalMethods>(null);
  const controllerRef  = useRef(new AbortController());
  const { customers }  = useTypedSelector(selectSystemSettings);
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  const { control, watch, trigger, setValue, setError, clearErrors, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      provider:         "aedc",
      meter_number:     "",
      amount:           "0",
      customer_address: "",
      customer_name:    "",
      phone:            user?.phone,
      meter_type:       METER_TYPE.PREPAID,
    },
  });

  const values      = watch();
  const isPrepaid   = values.meter_type === METER_TYPE.PREPAID;

  useEffect(() => { prefetchSystemSettings(); }, []);

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  const extraPlanDetails = useMemo(() =>
    calculateTransactionDetails(parseFloat(values.amount) || 0, "electricity", customers),
  [values.amount, customers]);

  useEffect(() => {
    if (readyToPay && values.meter_number) {
      setReadyToPay(false);
      setValue("customer_name", "");
      setValue("customer_address", "");
    }
  }, [values.meter_number]);

  const validateMeter = useCallback(async () => {
    trigger(["provider", "meter_type", "meter_number"]).then(async (allGood) => {
      if (!allGood) return;
      try {
        setIsProcessing(true);
        setShowProgress(true);
        setReadyToPay(false);
        setValue("customer_name", "");
        setValue("customer_address", "");
        clearErrors(["meter_number"]);

        const response = await API.post(
          route("services.resolveMeter"),
          { provider: values.provider, meter_type: values.meter_type, meter_number: values.meter_number },
          { signal: controllerRef.current.signal }
        );

        const { payload } = response.data;
        if (!payload || payload.invalid) {
          setError("meter_number", { message: "Could not verify the meter number" });
        } else {
          setValue("customer_name", payload.name);
          setValue("customer_address", payload.address);
          setReadyToPay(true);
        }
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        const errors = axiosError.response?.data?.errors;
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
            }
          }
        }
      } finally {
        setShowProgress(false);
        setIsProcessing(false);
      }
    });
  }, [values]);

  const openBottomSheet = useCallback(async () => {
    if (!readyToPay) return validateMeter();
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => bottomSheet.current?.present(), 100);
    }
  }, [readyToPay, validateMeter]);

  const closeBottomSheet = useCallback(() => bottomSheet.current?.dismiss(), []);

  const handleMakePayment = handleSubmit((vals) => {
    const transaction = { id: TransactionForm.Electricity, data: vals };
    dispatch(addPendingTransaction(transaction));
    closeBottomSheet();
    navigation.navigate("Confirm Transaction", { transactionId: transaction.id });
  });

  const transactionDetails = [
    { label: "Product Name", value: "Electricity", icon: require("@assets/images/services/aedc.png") },
    { label: "Customer Name", value: values.customer_name },
    ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
  ];

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Pay Electricity Bill"
        subtitle="Quick and easy bill payment"
        onBack={() => navigation.goBack()}
        rightIcon="lightning-bolt"
      />

      <ScrollableView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Provider */}
        <Text style={s.sectionLabel}>Service Provider</Text>
        <View style={s.card}>
          <DropdownMenuField
            label=""
            placeholder="Select Provider"
            name="provider"
            control={control}
            search
            data={Object.values(serviceProvidersMap.electricity).map((p) => ({
              label: p.name,
              id: p.serviceId,
              image: p.logo,
            }))}
          />
        </View>

        {/* Meter type */}
        <Text style={s.sectionLabel}>Meter Type</Text>
        <View style={s.meterTypeRow}>
          <TouchableOpacity
            style={[s.meterTypeBtn, isPrepaid && s.meterTypeBtnActive]}
            onPress={() => setValue("meter_type", METER_TYPE.PREPAID)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="lightning-bolt-circle"
              size={18}
              color={isPrepaid ? BLUE : "#9ca3af"}
            />
            <Text style={[s.meterTypeBtnText, isPrepaid && s.meterTypeBtnTextActive]}>
              Prepaid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.meterTypeBtn, !isPrepaid && s.meterTypeBtnActive]}
            onPress={() => setValue("meter_type", METER_TYPE.POSTPAID)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={!isPrepaid ? BLUE : "#9ca3af"}
            />
            <Text style={[s.meterTypeBtnText, !isPrepaid && s.meterTypeBtnTextActive]}>
              Postpaid
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meter number */}
        <Text style={s.sectionLabel}>Meter Number</Text>
        <View style={s.card}>
          <Controller
            control={control}
            name="meter_number"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Meter Number"
                placeholder="Enter meter number"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          {/* Verifying indicator */}
          {showProgress && (
            <View style={s.verifyingRow}>
              <ActivityIndicator animating size="small" color={BLUE} />
              <Text style={s.verifyingText}>Verifying meter number...</Text>
            </View>
          )}

          {/* Verified customer */}
          {values.customer_name ? (
            <View style={s.verifiedBox}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={s.verifiedName}>{values.customer_name}</Text>
                {values.customer_address ? (
                  <Text style={s.verifiedAddress}>{values.customer_address}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        {/* Amount */}
        <Text style={s.sectionLabel}>Amount</Text>
        <View style={s.card}>
          <NairaInput name="amount" control={control} />
          <WalletBalanceHelper {...walletValidation} />
        </View>

        {/* Info note */}
        <View style={s.infoNote}>
          <MaterialCommunityIcons name="information-outline" size={14} color={BLUE} />
          <Text style={s.infoNoteText}>
            Minimum payment is ₦{MIN_PAYMENT_AMOUNT.toLocaleString()}. Token will be delivered instantly after payment.
          </Text>
        </View>

      </ScrollableView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.actionBtn, (isProcessing || !walletValidation.canPay) && s.actionBtnDisabled]}
          onPress={openBottomSheet}
          disabled={isProcessing || !walletValidation.canPay}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator size={18} color="#fff" />
          ) : (
            <MaterialCommunityIcons
              name={readyToPay ? "lightning-bolt" : "magnify"}
              size={18}
              color="#fff"
            />
          )}
          <Text style={s.actionBtnText}>
            {isProcessing ? "Verifying..." : readyToPay ? "Proceed to Pay" : "Verify Meter"}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Bill Payment"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onDismiss={closeBottomSheet}
        onConfirm={handleMakePayment}
        snapPoints={["58%", "58%"]}
        disabled={!walletValidation.canPay}
      />

      <TransactionErrorSheet />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#f8f9fb" },
  scroll: { padding: 16, paddingBottom: 100 },

  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card:         { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 16 },

  // Meter type toggle
  meterTypeRow:          { flexDirection: "row", gap: 10, marginBottom: 16 },
  meterTypeBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e5e7eb" },
  meterTypeBtnActive:    { borderColor: BLUE, backgroundColor: "#EEF3FF" },
  meterTypeBtnText:      { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  meterTypeBtnTextActive:{ color: BLUE },

  // Meter verification feedback
  verifyingRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  verifyingText:   { fontSize: 12, color: "#6b7280" },
  verifiedBox:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#bbf7d0" },
  verifiedName:    { fontSize: 13, fontWeight: "700", color: "#15803d" },
  verifiedAddress: { fontSize: 11, color: "#16a34a", marginTop: 2 },

  // Info note
  infoNote:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EEF3FF", borderRadius: 10, padding: 12, marginBottom: 8 },
  infoNoteText: { flex: 1, fontSize: 12, color: "#374151", lineHeight: 18 },

  // Footer
  footer:             { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  actionBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14 },
  actionBtnDisabled:  { opacity: 0.5 },
  actionBtnText:      { fontSize: 15, fontWeight: "700", color: "#fff" },
});
