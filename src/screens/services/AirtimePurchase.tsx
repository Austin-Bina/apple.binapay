import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, KeyboardAvoidingView, Platform,
  StatusBar, RefreshControl, Keyboard, Image, Dimensions, FlatList,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { selectNairaBalance } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { TransactionForm } from "@enum/transaction";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { serviceProvidersMap } from "@constants/providers";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { calculateTransactionDetails, formatToNaira, zodAmountValidation } from "@utils/money";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { usePhoneValidation } from "@hooks/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import { ServicesStackScreenProps } from "@navigators/types";
import { detectNetworkFromPhone } from "@lib/networkDetector";
import { debounce } from "lodash";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import ContactPickerModal from "@components/ui/modals/pick-contacts";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE        = "#2563EB";
const BRAND       = "#1E3A8A";
const BLUE_LIGHT  = "#EEF3FF";
const BG          = "#F2F2F7";
const SURFACE     = "#FFFFFF";
const SEPARATOR   = "#E5E7EB";
const LABEL       = "#111827";
const SUBLABEL    = "#6B7280";
const PLACEHOLDER = "#9CA3AF";
const GREEN       = "#16A34A";
const GREEN_LIGHT = "#F0FDF4";

const MIN_AMOUNT = 50;

const schema = z.object({
  provider: z.string().min(3),
  phone:    zodPhoneValidation,
  amount:   zodAmountValidation(MIN_AMOUNT, true),
  pin:      z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

type Props = ServicesStackScreenProps<"Airtime Purchase">;

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export default function AirtimePurchaseScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const nairaBalance = useTypedSelector(selectNairaBalance);
  const { customers, transaction } = useTypedSelector(selectSystemSettings);

  const [showContactModal, setShowContactModal] = useState(false);
  const [autoDetected,     setAutoDetected]     = useState(true);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", { ifOlderThan: MAX_CACHE_AGE_SEC });

  const {
    control, watch, handleSubmit, setError, clearErrors,
    reset, trigger, setValue, formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: getDefaultProvider(user?.phone),
      phone:    user?.phone,
      amount:   "0",
    },
    mode: "onChange",
  });

  const values = watch();

  useEffect(() => { prefetchSystemSettings(); }, [prefetchSystemSettings]);

  const revalidatePhone = usePhoneValidation({
    phone: values.phone, provider: values.provider,
    portedNumber: true, setError, clearErrors,
  });

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  const extraPlanDetails = useMemo(() =>
    calculateTransactionDetails(parseFloat(values.amount) || 0, "airtime", customers),
  [values.amount, customers]);

  const airtimeProviders = useMemo(() =>
    Object.values(serviceProvidersMap.internet).filter(p =>
      transaction.airtime.networks.includes(p.serviceId)
    ),
  [transaction.airtime]);

  const selectedProvider = useMemo(() =>
    airtimeProviders.find(p => p.serviceId === values.provider),
  [airtimeProviders, values.provider]);

  const transactionDetails = useMemo(() => [
    { label: "Network", value: values.provider, icon: serviceProvidersMap.internet[values.provider]?.logo },
    { label: "Number",  value: values.phone },
    ...Object.keys(extraPlanDetails).map(k => ({ label: k, value: extraPlanDetails[k] })),
  ], [values.provider, values.phone, extraPlanDetails]);

  const onRefresh = useCallback(() => { prefetchSystemSettings(); }, [prefetchSystemSettings]);

  const handleSelectProvider = useCallback((serviceId: string) => {
    setAutoDetected(false);
    reset({ ...values, provider: serviceId });
  }, [values, reset]);

  const handleSelectContact = useCallback((phone: string) => {
    reset({ ...values, phone, provider: getDefaultProvider(phone) });
    setShowContactModal(false);
  }, [values, reset]);

  const openBottomSheet = useCallback(async () => {
    const valid = await trigger();
    if (valid) { Keyboard.dismiss(); setTimeout(() => bottomSheet.current?.present(), 100); }
  }, [trigger]);

  const closeBottomSheet = useCallback(() => { bottomSheet.current?.dismiss(); }, []);

  const handleMakePayment = handleSubmit((vals) => {
    if (!revalidatePhone()) return;
    const txn = { id: TransactionForm.Airtime, data: vals };
    dispatch(addPendingTransaction(txn));
    navigation.navigate("Confirm Transaction", { transactionId: txn.id });
    setTimeout(() => closeBottomSheet(), 100);
  });

  const navigateToHistory = useCallback(async () => {
    const { navigate } = await getNavigate();
    navigate("Main", { screen: SCREENS.HOME, params: { screen: SCREENS.TRANSACTION_HISTORY, params: { transactionId: undefined } } });
  }, []);

  const debouncedDetect = useMemo(() =>
    debounce((phone: string) => {
      if (!autoDetected) return;
      const detected = detectNetworkFromPhone(phone);
      if (detected) setValue("provider", detected);
    }, 400),
  [autoDetected]);

  useEffect(() => { debouncedDetect(values.phone); }, [values.phone]);

  const parsedAmount = parseFloat(values.amount) || 0;
  const discount = customers.airtime_discount_percentage ?? 0;
  const youGet = parsedAmount;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScreenHeader
        title="Buy Airtime"
        subtitle="Top up any Nigerian number instantly"
        onBack={() => navigation.goBack()}
        rightIcon="history"
        onRightPress={navigateToHistory}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* ── Network + Phone card ── */}
        <View style={s.card}>
          {/* Network selector row */}
          <View style={s.networkSelectorRow}>
            {airtimeProviders.map(p => (
              <TouchableOpacity
                key={p.serviceId}
                style={[s.networkChip, values.provider === p.serviceId && s.networkChipActive]}
                onPress={() => handleSelectProvider(p.serviceId)}
                activeOpacity={0.75}
              >
                <Image source={p.logo} style={s.networkChipLogo} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.cardDivider} />

          {/* Phone input row */}
          <View style={s.phoneRow}>
            <View style={s.networkLogoSmall}>
              {selectedProvider?.logo ? (
                <Image source={selectedProvider.logo} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="signal" size={16} color={PLACEHOLDER} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <TextInput
                      style={s.phoneInput}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter phone number"
                      placeholderTextColor={PLACEHOLDER}
                      keyboardType="phone-pad"
                      maxLength={14}
                    />
                    {!!error && <Text style={s.fieldError}>{error.message}</Text>}
                  </View>
                )}
              />
            </View>
            <TouchableOpacity style={s.contactBtn} onPress={() => setShowContactModal(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="account-circle-outline" size={26} color={BLUE} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cashback banner ── */}
        {discount > 0 && (
          <TouchableOpacity style={s.cashbackBanner} activeOpacity={0.8}>
            <MaterialCommunityIcons name="gift-outline" size={18} color={BLUE} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.cashbackTitle}>Get {discount}% bonus airtime</Text>
              <Text style={s.cashbackSub}>Extra credit on every airtime purchase.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
          </TouchableOpacity>
        )}

        {/* ── Amount card ── */}
        <Text style={s.sectionLabel}>Amount</Text>
        <View style={s.card}>
          <View style={s.amountRow}>
            <Text style={s.currencySymbol}>₦</Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <TextInput
                  style={s.amountInput}
                  value={value === "0" ? "" : value}
                  onChangeText={v => onChange(v.replace(/[^0-9.]/g, ""))}
                  placeholder="0"
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="numeric"
                />
              )}
            />
          </View>

          <View style={s.cardDivider} />

          {/* Quick amounts */}
          <View style={s.quickRow}>
            {QUICK_AMOUNTS.map(v => (
              <TouchableOpacity
                key={v}
                style={[s.quickChip, values.amount === String(v) && s.quickChipActive]}
                onPress={() => setValue("amount", String(v), { shouldValidate: true })}
                activeOpacity={0.75}
              >
                <Text style={[s.quickChipText, values.amount === String(v) && s.quickChipTextActive]}>
                  ₦{v >= 1000 ? `${v / 1000}k` : v}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={s.quickChip}
              onPress={() => setValue("amount", nairaBalance, { shouldValidate: true })}
              activeOpacity={0.75}
            >
              <Text style={s.quickChipText}>Max</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── You get banner ── */}
        {parsedAmount >= MIN_AMOUNT && (
  <View style={s.youGetCard}>
    <MaterialCommunityIcons name="check-circle-outline" size={16} color={GREEN} />
    <Text style={s.youGetText}>
      You will receive <Text style={s.youGetAmount}>
        ₦{parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text> airtime — you save <Text style={s.youGetAmount}>
        ₦{(parsedAmount * discount / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </Text>
    </Text>
  </View>
)}

        {/* ── Wallet card ── */}
        <View style={s.walletCard}>
          <Text style={s.walletLabel}>Payment Method</Text>
          <View style={s.walletRow}>
            <View style={s.walletIconWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={20} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.walletName}>Main Wallet</Text>
              <Text style={s.walletBalance}>
                ₦{parseFloat(nairaBalance || "0").toLocaleString("en-NG", { minimumFractionDigits: 2 })} Available Balance
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={18} color={PLACEHOLDER} />
          </View>
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.payBtn, (!walletValidation.canPay || !isValid || airtimeProviders.length === 0) && s.payBtnDisabled]}
          onPress={openBottomSheet}
          disabled={!walletValidation.canPay || !isValid || airtimeProviders.length === 0}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="wallet-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.payBtnText}>Proceed to Payment</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Airtime Purchase"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={["60%", "60%"]}
        disabled={!walletValidation.canPay}
      />

      <ContactPickerModal
        index={1}
        isVisible={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSelectContact={handleSelectContact}
      />

      <TransactionErrorSheet />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },

  card:         { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: SEPARATOR, marginBottom: 12, overflow: "hidden" },
  cardDivider:  { height: 1, backgroundColor: SEPARATOR },

  // Network selector
  networkSelectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 14, paddingVertical: 14 },
  networkChip:        { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: SEPARATOR, backgroundColor: BG, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  networkChipActive:  { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  networkChipLogo:    { width: 40, height: 40, borderRadius: 20 },

  // Phone row
  phoneRow:        { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  networkLogoSmall:{ width: 34, height: 34, borderRadius: 17, backgroundColor: BG, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  phoneInput:      { flex: 1, fontSize: 16, fontWeight: "600", color: LABEL, paddingVertical: 6 },
  fieldError:      { fontSize: 11, color: "#dc2626", marginTop: 2 },
  contactBtn:      { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },

  // Cashback
  cashbackBanner: { flexDirection: "row", alignItems: "center", backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#BFDBFE" },
  cashbackTitle:  { fontSize: 13, fontWeight: "700", color: BRAND },
  cashbackSub:    { fontSize: 11, color: SUBLABEL, marginTop: 1 },

  // Amount
  sectionLabel:  { fontSize: 13, fontWeight: "600", color: LABEL, marginBottom: 8 },
  amountRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  currencySymbol:{ fontSize: 26, fontWeight: "300", color: SUBLABEL, marginRight: 4 },
  amountInput:   { flex: 1, fontSize: 32, fontWeight: "700", color: LABEL, letterSpacing: -0.5 },
  quickRow:      { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12, flexWrap: "wrap" },
  quickChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: BG, borderWidth: 1, borderColor: SEPARATOR },
  quickChipActive:    { backgroundColor: BLUE, borderColor: BLUE },
  quickChipText:      { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  quickChipTextActive:{ color: "#fff" },

  // You get
  youGetCard:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: GREEN_LIGHT, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#BBF7D0" },
  youGetText:   { fontSize: 13, color: GREEN },
  youGetAmount: { fontWeight: "700" },

  // Wallet
  walletCard:     { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: SEPARATOR },
  walletLabel:    { fontSize: 11, color: PLACEHOLDER, marginBottom: 10 },
  walletRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  walletName:     { fontSize: 14, fontWeight: "600", color: LABEL },
  walletBalance:  { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // Footer
  footer:        { backgroundColor: SURFACE, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: SEPARATOR },
  payBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14 },
  payBtnDisabled:{ opacity: 0.45 },
  payBtnText:    { fontSize: 16, fontWeight: "700", color: "#fff" },
});
