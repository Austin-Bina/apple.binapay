import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal, KeyboardAvoidingView,
  Platform, StatusBar, RefreshControl, Keyboard, Image,
  Dimensions,
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
import { TransactionForm } from "@enum/transaction";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { useGetDataPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { serviceProvidersMap } from "@constants/providers";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { formatToNaira } from "@utils/money";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { usePhoneValidation } from "@hooks/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import { ServicesStackScreenProps } from "@navigators/types";
import { InternetProviders } from "@type/app";
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

const { width: SW } = Dimensions.get("window");
const PLAN_CARD_W = (SW - 48) / 3;

type Props = ServicesStackScreenProps<"Data Purchase">;

const schema = z.object({
  provider:    z.string().min(3),
  phone:       zodPhoneValidation,
  data_bundle: z.number().optional(),
  data_amount: z.string(),
  amount:      z.string(),
  type:        z.string(),
  vendor:      z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function DataPurchaseScreen({ navigation }: Props) {
  const insets       = useSafeAreaInsets();
  const dispatch     = useTypedDispatch();
  const user         = useTypedSelector(selectUser);
  const nairaBalance = useTypedSelector(selectNairaBalance);

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [autoDetected,     setAutoDetected]     = useState(true);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const { data: queryData, isFetching, isError, refetch } = useGetDataPlansQuery();
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", { ifOlderThan: MAX_CACHE_AGE_SEC });

  const {
    control, watch, trigger, clearErrors, setError,
    reset, setValue, handleSubmit, formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider:    getDefaultProvider(user?.phone),
      phone:       user?.phone,
      data_bundle: undefined,
      data_amount: "",
      amount:      "0",
      type:        "",
      vendor:      "",
    },
    mode: "onChange",
  });

  const values   = watch();
  const provider = values.provider as InternetProviders;

  const revalidatePhone = usePhoneValidation({
    phone: values.phone, provider: values.provider,
    portedNumber: true, setError, clearErrors,
  });
  const walletValidation = useWalletBalanceValidation({ amount: parseFloat(values.amount) || 0 });

  useEffect(() => { prefetchSystemSettings(); }, [prefetchSystemSettings]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const dataProviders = useMemo(() => {
    const available = Object.keys(queryData?.data_plans || {}).filter(k => {
      const plans = (queryData?.data_plans as Record<string, any[]>)?.[k] ?? [];
      return plans.length > 0;
    });
    return Object.values(serviceProvidersMap.internet).filter(p => available.includes(p.serviceId));
  }, [queryData]);

  const selectedProvider = useMemo(() =>
    dataProviders.find(p => p.serviceId === values.provider),
  [dataProviders, values.provider]);

  const dataTypes = useMemo(() => {
    const allTypes = queryData?.popular_data_types || [];
    return allTypes
      .filter(t =>
        !t.supported_networks ||
        t.supported_networks
          .map((n: any) => n?.toUpperCase?.() ?? "")
          .includes(provider.toUpperCase())
      )
      .map(t => ({ id: t.type, label: t.name }));
  }, [queryData, provider]);

  const dataPlans = useMemo(() => {
    const plans = queryData?.data_plans[provider] || [];
    return plans
      .filter(p => values.type ? p.plan_type === values.type : true)
      .map(p => ({
        ...p,
        amount:      p.plan_amount,
        data_amount: p.plan,
        data_bundle: p.id,
        type:        p.plan_type,
        vendor:      p.vendor,
      }));
  }, [queryData, values.provider, values.type]);

  useEffect(() => {
    if (dataTypes.length > 0 && !values.type) setValue("type", dataTypes[0].id);
  }, [dataTypes]);

  const transactionDetails = useMemo(() => ([
    { label: "Network",     value: values.provider, icon: serviceProvidersMap.internet[values.provider]?.logo },
    { label: "Data Amount", value: values.data_amount },
    { label: "Number",      value: values.phone },
    { label: "You Pay",     value: formatToNaira(values.amount) },
  ]), [values]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    if (!isFetching) { refetch(); prefetchSystemSettings(); }
  }, [isFetching]);

  const handleSelectPlan = useCallback(async (plan: any) => {
    const updated = {
      ...values,
      data_bundle: plan.data_bundle,
      data_amount: plan.data_amount,
      amount:      plan.amount,
      vendor:      plan.vendor,
    };
    reset(updated);
    // Auto-open confirmation sheet after selecting a plan
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => bottomSheet.current?.present(), 150);
    }
  }, [reset, values, trigger]);

  const handleSelectType = useCallback((type: string) => {
    reset({ ...values, type, data_bundle: undefined, data_amount: "", amount: "0" });
  }, [reset, values]);

  const handleSelectNetwork = useCallback((serviceId: string) => {
    setAutoDetected(false);
    reset({ ...values, provider: serviceId, data_bundle: undefined, data_amount: "", amount: "0", type: "", vendor: "" });
    setShowNetworkModal(false);
  }, [values, reset]);

  const handleSelectContact = useCallback((phone: string) => {
    reset({ ...values, phone, provider: getDefaultProvider(phone) });
    setShowContactModal(false);
  }, [values, reset]);

  const closeBottomSheet = useCallback(() => { bottomSheet.current?.dismiss(); }, []);

  const handleMakePayment = handleSubmit((vals) => {
    if (!revalidatePhone()) return;
    const txn = { id: TransactionForm.Data, data: vals };
    dispatch(addPendingTransaction(txn));
    closeBottomSheet();
    navigation.navigate("Confirm Transaction", { transactionId: txn.id });
  });

  const navigateToHistory = useCallback(async () => {
    const { navigate } = await getNavigate();
    navigate("Main", {
      screen: SCREENS.HOME,
      params: { screen: SCREENS.TRANSACTION_HISTORY, params: { transactionId: undefined } },
    });
  }, []);

  // Auto-detect network from phone
  const debouncedDetect = useMemo(() =>
    debounce((phone: string) => {
      if (!autoDetected) return;
      const detected = detectNetworkFromPhone(phone);
      if (detected) setValue("provider", detected);
    }, 400),
  [autoDetected]);

  useEffect(() => { debouncedDetect(values.phone); }, [values.phone]);

  // Add after your other useEffects
useEffect(() => {
  const unsubscribe = navigation.addListener("focus", () => {
    reset({
      provider:    values.provider,
      phone:       values.phone,
      data_bundle: undefined,
      data_amount: "",
      amount:      "0",
      type:        values.type,
      vendor:      "",
    });
  });
  return unsubscribe;
}, [navigation]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScreenHeader
        title="Buy Data Bundle"
        subtitle="Stay connected with the best data plans"
        onBack={() => navigation.goBack()}
        rightIcon="history"
        onRightPress={navigateToHistory}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={BLUE} />}
      >
        {/* ── Network + Phone card ── */}
        <View style={s.card}>
          <TouchableOpacity style={s.networkRow} onPress={() => setShowNetworkModal(true)} activeOpacity={0.8}>
            <View style={s.networkLogo}>
              {selectedProvider?.logo ? (
                <Image source={selectedProvider.logo} style={s.networkLogoImg} resizeMode="contain" />
              ) : (
                <MaterialCommunityIcons name="signal" size={22} color={PLACEHOLDER} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
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
                )}
              />
            </View>
            <TouchableOpacity style={s.contactBtn} onPress={() => setShowContactModal(true)} activeOpacity={0.7}>
              <MaterialCommunityIcons name="account-circle-outline" size={26} color={BLUE} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* ── Cashback banner ── */}
        <TouchableOpacity style={s.cashbackBanner} activeOpacity={0.8}>
          <MaterialCommunityIcons name="gift-outline" size={18} color={BLUE} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.cashbackTitle}>Get up to 2% cashback</Text>
            <Text style={s.cashbackSub}>On your first two data purchases daily.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
        </TouchableOpacity>

        {/* ── Plan type tabs ── */}
        {dataTypes.length > 0 && (
          <View style={s.tabsWrap}>
            <Text style={s.sectionLabel}>Choose Plan</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
              <View style={s.tabsRow}>
                {dataTypes.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.typeTab, values.type === t.id && s.typeTabActive]}
                    onPress={() => handleSelectType(t.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.typeTabText, values.type === t.id && s.typeTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Plan grid — all plans, no pagination ── */}
        {isFetching ? (
          <View style={s.planGrid}>
            {[...Array(9)].map((_, i) => <View key={i} style={s.skeletonCard} />)}
          </View>
        ) : isError ? (
          <View style={s.stateWrap}>
            <MaterialCommunityIcons name="wifi-alert" size={32} color="#dc2626" />
            <Text style={s.errorTitle}>Failed to load plans</Text>
            <TouchableOpacity style={s.retryBtn} onPress={onRefresh}>
              <Text style={s.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : dataPlans.length === 0 ? (
          <View style={s.stateWrap}>
            <MaterialCommunityIcons name="database-off-outline" size={32} color={PLACEHOLDER} />
            <Text style={s.emptyText}>No plans available</Text>
          </View>
        ) : (
          <View style={s.planGrid}>
            {dataPlans.map((plan) => {
              const isSelected = values.data_bundle === plan.data_bundle;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[s.planCard, isSelected && s.planCardSelected]}
                  onPress={() => handleSelectPlan(plan)}
                  activeOpacity={0.75}
                >
                  {isSelected && (
                    <View style={s.planCheckWrap}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                    </View>
                  )}
                  <Text style={[s.planData, isSelected && s.planDataSelected]}>
                    {plan.data_amount}
                  </Text>
                  <Text style={[s.planPrice, isSelected && s.planPriceSelected]}>
                    {formatToNaira(plan.amount)}
                  </Text>
                  <Text style={s.planValidity}>{plan.month_validate}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Wallet card — at the bottom ── */}
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

      {/* ── Network picker bottom sheet ── */}
      <Modal
        visible={showNetworkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNetworkModal(false)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowNetworkModal(false)}>
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.modalTitle}>Select Network</Text>
            {dataProviders.map((p, i) => {
              const isSel = values.provider === p.serviceId;
              return (
                <TouchableOpacity
                  key={p.serviceId}
                  style={[
                    s.networkOption,
                    i < dataProviders.length - 1 && s.networkOptionBorder,
                  ]}
                  onPress={() => handleSelectNetwork(p.serviceId)}
                  activeOpacity={0.7}
                >
                  <View style={s.networkOptionLogo}>
                    <Image source={p.logo} style={{ width: 36, height: 36, borderRadius: 18 }} resizeMode="contain" />
                  </View>
                  <Text style={[s.networkOptionName, isSel && s.networkOptionNameActive]}>
                    {p.name}
                  </Text>
                  {isSel && <MaterialCommunityIcons name="check-circle" size={20} color={BLUE} />}
                </TouchableOpacity>
              );
            })}
            <View style={s.networkNote}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color={PLACEHOLDER} />
              <Text style={s.networkNoteText}>
                Your network will be used to show only available data plans.
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Confirmation sheet ── */}
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
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  // Network + phone card
  card:           { backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1, borderColor: SEPARATOR, marginBottom: 12, overflow: "hidden" },
  networkRow:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  networkLogo:    { width: 52, height: 52, borderRadius: 26, backgroundColor: BG, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  networkLogoImg: { width: 48, height: 48, borderRadius: 24 },
  phoneInput:     { fontSize: 18, fontWeight: "700", color: LABEL, paddingVertical: 0, flex: 1 },
  contactBtn:     { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },

  // Cashback banner
  cashbackBanner: { flexDirection: "row", alignItems: "center", backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#BFDBFE" },
  cashbackTitle:  { fontSize: 13, fontWeight: "700", color: BRAND },
  cashbackSub:    { fontSize: 11, color: SUBLABEL, marginTop: 1 },

  // Plan type tabs
  tabsWrap:         { marginBottom: 12 },
  sectionLabel:     { fontSize: 13, fontWeight: "600", color: LABEL, marginBottom: 10 },
  tabsScroll:       { borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  tabsRow:          { flexDirection: "row" },
  typeTab:          { paddingHorizontal: 16, paddingVertical: 10, marginRight: 4 },
  typeTabActive:    { borderBottomWidth: 2, borderBottomColor: BLUE },
  typeTabText:      { fontSize: 13, fontWeight: "500", color: SUBLABEL },
  typeTabTextActive:{ color: BLUE, fontWeight: "700" },

  // Plan grid — all plans, wrapping
  planGrid:         { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  planCard:         {
    width: PLAN_CARD_W, borderRadius: 12, backgroundColor: SURFACE,
    borderWidth: 1, borderColor: SEPARATOR,
    padding: 10, alignItems: "flex-start", position: "relative",
    minHeight: 80,
  },
  planCardSelected: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  planCheckWrap:    { position: "absolute", top: 6, right: 6 },
  planData:         { fontSize: 13, fontWeight: "800", color: LABEL, marginBottom: 4 },
  planDataSelected: { color: BRAND },
  planPrice:        { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  planPriceSelected:{ color: BLUE },
  planValidity:     { fontSize: 11, color: PLACEHOLDER, marginTop: 3 },

  // Skeleton loading
  skeletonCard: { width: PLAN_CARD_W, height: 80, borderRadius: 12, backgroundColor: SEPARATOR },

  // Empty / error states
  stateWrap:  { alignItems: "center", paddingVertical: 40, gap: 10 },
  errorTitle: { fontSize: 14, fontWeight: "600", color: "#dc2626" },
  emptyText:  { fontSize: 14, color: PLACEHOLDER },
  retryBtn:   { backgroundColor: BLUE_LIGHT, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  retryText:  { fontSize: 13, fontWeight: "600", color: BLUE },

  // Wallet card
  walletCard:     { backgroundColor: SURFACE, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: SEPARATOR },
  walletLabel:    { fontSize: 11, color: PLACEHOLDER, marginBottom: 10 },
  walletRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  walletName:     { fontSize: 14, fontWeight: "600", color: LABEL },
  walletBalance:  { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // Network picker bottom sheet
  modalOverlay:        { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet:          { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: SEPARATOR, alignSelf: "center", marginBottom: 18 },
  modalTitle:          { fontSize: 17, fontWeight: "700", color: BRAND, marginBottom: 14 },
  networkOption:       { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  networkOptionBorder: { borderBottomWidth: 1, borderBottomColor: SEPARATOR },
  networkOptionLogo:   { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: BG },
  networkOptionName:   { flex: 1, fontSize: 15, fontWeight: "500", color: LABEL },
  networkOptionNameActive: { color: BLUE, fontWeight: "700" },
  networkNote:         { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 14 },
  networkNoteText:     { fontSize: 11, color: PLACEHOLDER, flex: 1 },
});
