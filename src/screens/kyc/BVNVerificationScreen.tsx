// ═══════════════════════════════════════════════════════════════════════════
// BVNVerificationScreen — iOS UI, all logic untouched
// ═══════════════════════════════════════════════════════════════════════════
import { VerifiedBadge } from "@components/icons/svg";
import Banner from "@components/ui/banner";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import MaskedInput from "@components/ui/form/mask-input";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { bvn_nin_mask } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import tw from "@lib/tailwind";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { authSliceActions } from "@store/slice/auth";
import { settingsSliceActions } from "@store/slice/settings";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { formatWithMask } from "react-native-mask-input";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-root-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vs } from "react-native-size-matters";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { z } from "zod";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

type BVNProps = KYCStackScreenProps<typeof SCREENS.BVN_VERIFICATION>;

const bvnSchema = z.object({
  bvn: z.string().transform(v => v.replace(/\D/g, "")).refine(v => v.length === 11, { message: "BVN must be exactly 11 digits" }),
  account_number: z.string().transform(v => v.replace(/\D/g, "")).refine(v => v.length === 10, { message: "Account number must be exactly 10 digits" }),
  bank_code: z.string().nonempty("Please select bank"),
});
type BVNFormValues = z.infer<typeof bvnSchema>;
type Bank = { name: string; code: string };

export default function BVNVerificationScreen({ navigation }: BVNProps) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const bottomSheet   = useRef<BottomSheetModalMethods>(null);

  // ── All original state + logic — untouched ────────────────────────────────
  const [banks, setBanks]                   = useState<Bank[]>([]);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [hasError, setHasError]             = useState(false);
  const [showProgress, setShowProgress]     = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts]     = useState<number | null>(null);

  const { control, handleSubmit, setError, watch, trigger } = useForm<BVNFormValues>({
    resolver: zodResolver(bvnSchema),
    defaultValues: { bvn: "", account_number: "", bank_code: "" },
  });

  const values = watch();
  const { masked } = formatWithMask({ text: values.bvn, mask: bvn_nin_mask });

  const formattedRemainingAttempts = useMemo(() => {
    if (remainingAttempts === null) return null;
    return Math.max(0, customers.bvn_verification_limit - (remainingAttempts ?? 0));
  }, [remainingAttempts]);

  const filteredBanks = useMemo(() =>
    banks.filter(b => !!b.code).map(b => ({ label: b.name, id: b.code })).sort((a, b) => a.label.localeCompare(b.label)),
    [banks]
  );

  useEffect(() => { if (user?.id) setRemainingAttempts(user.verification_attempts); }, [user?.id]);
  useEffect(() => {
    API.get(route("bank.list")).then(r => setBanks(r.data.banks)).catch(console.error);
  }, []);

  const openBottomSheet = useCallback(async () => {
    if (await trigger()) { Keyboard.dismiss(); setTimeout(() => bottomSheet.current?.present(), 100); }
  }, [trigger]);
  const closeBottomSheet = () => bottomSheet.current?.dismiss();

  const validateBank = useCallback(async () => {
    trigger(["bank_code", "account_number"]).then(async allGood => {
      if (!allGood) return;
      try {
        setIsProcessing(true); setShowProgress(true); setHasError(false); setResolvedAccountName("");
        const response = await API.post(route("bank.resolveAccount"), { bank_code: values.bank_code, account_number: values.account_number });
        const { account_name } = response.data;
        if (account_name) { setResolvedAccountName(account_name); }
        else { setError("account_number", { message: "Account not found. Check the number and bank." }); }
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        if (axiosError.response) { setError("account_number", { message: axiosError.response.data?.message }); }
        else { setHasError(true); }
      } finally { setShowProgress(false); setIsProcessing(false); }
    });
  }, [values]);

  const onSubmit = handleSubmit(async form => {
    if (!resolvedAccountName) return;
    try {
      setIsProcessing(true);
      const response = await API.post("/api/v1/kyc/verify-bvn", form);
      dispatch(authSliceActions.updateUser(response.data.user));
      await dispatch(authSliceActions.fetchUserProfile());
      closeBottomSheet();
      navigation.navigate(SCREENS.VERIFICATION_SUCCESS, { tier: 1 });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message, errors, error_code } = response.data;
        if (message && typeof message === "string") showToast({ message, position: Toast.positions.TOP });
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) setError(field as keyof BVNFormValues, { message: fieldErrors.join(", ") });
          }
          return;
        }
        if (error_code === "client_insufficient_funds") {
          return dispatch(settingsSliceActions.setApplicationError({ code: "client_insufficient_funds", context: message }));
        }
        setHasError(true);
      }
    } finally { setIsProcessing(false); closeBottomSheet(); }
  });

  return (
    <View style={[bv.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={bv.navBar}>
        <TouchableOpacity style={bv.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={bv.navCenter}>
          <Text style={bv.navTitle}>BVN Verification</Text>
          <Text style={bv.navSub}>Tier 1 – Basic Verification</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={bv.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={bv.title}>BVN &amp; Account Validation</Text>
        <Text style={bv.subtitle}>Verify your BVN for added security and increased transaction limits.</Text>

        {hasError && <Banner content="We had trouble verifying your account name. Please try again." />}

        <View style={[bv.formCard, IOS_SHADOW]}>
          <Controller control={control} name="bvn"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput label="Bank Verification Number" placeholder="Enter your BVN" mode="outlined"
                onBlur={onBlur} value={value} mask={bvn_nin_mask} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} />
            )}
          />
          <Controller control={control} name="account_number"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput label="Account Number" placeholder="Enter account number" keyboardType="numeric"
                mode="outlined" onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} />
            )}
          />
          {showProgress && !resolvedAccountName && (
            <View style={bv.progressRow}>
              <ActivityIndicator animating size="small" />
              <Text style={bv.progressText}>Verifying account number…</Text>
            </View>
          )}
          {resolvedAccountName && (
            <View style={bv.verifiedRow}>
              <VerifiedBadge />
              <Text style={bv.verifiedName}>{resolvedAccountName}</Text>
            </View>
          )}
          <DropdownMenuField label="Select your bank" placeholder="Select bank" name="bank_code"
            control={control} data={filteredBanks} search={true} />
        </View>

        {formattedRemainingAttempts !== null && (
          <View style={[bv.attemptsCard, IOS_SHADOW]}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#D97706" />
            <Text style={bv.attemptsText}>
              You have <Text style={bv.attemptsCount}>{formattedRemainingAttempts}</Text> free verification attempts remaining.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[bv.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
        <TouchableOpacity
          style={[bv.btn, isProcessing && bv.btnDisabled]}
          onPress={resolvedAccountName ? openBottomSheet : validateBank}
          disabled={isProcessing}
          activeOpacity={0.85}>
          <Text style={bv.btnText}>
            {isProcessing ? "Please wait…" : resolvedAccountName ? "Complete Verification" : "Verify Name"}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal ref={bottomSheet} initialSnapPoints={[vs(280), vs(280)]} onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text style={bv.sheetTitle}>Please Review</Text>
            <Text style={bv.sheetLabel}>Your BVN</Text>
            <Text style={bv.sheetValue}>{masked}</Text>
            <TouchableOpacity style={[bv.btn, isProcessing && bv.btnDisabled, { marginTop: 24 }]}
              onPress={onSubmit} disabled={isProcessing} activeOpacity={0.85}>
              <Text style={bv.btnText}>{isProcessing ? "Verifying…" : "Yes, it's correct"}</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const bv = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:    { flex: 1, alignItems: "center" },
  navTitle:     { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:       { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  title:        { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 6 },
  subtitle:     { fontSize: 14, color: SUBLABEL, marginBottom: 20 },
  formCard:     { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 14, gap: 4 },
  progressRow:  { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  progressText: { fontSize: 12, color: SUBLABEL },
  verifiedRow:  { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  verifiedName: { fontSize: 14, fontWeight: "600", color: BLUE },
  attemptsCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FDE68A" },
  attemptsText: { flex: 1, fontSize: 13, color: SUBLABEL },
  attemptsCount:{ color: "#D97706", fontWeight: "700" },
  footer:       { paddingHorizontal: 16, paddingTop: 12, backgroundColor: SURFACE, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  btn:          { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { fontSize: 16, fontWeight: "700", color: SURFACE },
  sheetTitle:   { fontSize: 18, fontWeight: "700", color: BRAND, textAlign: "center", marginBottom: 16 },
  sheetLabel:   { fontSize: 14, color: SUBLABEL, textAlign: "center" },
  sheetValue:   { fontSize: 28, fontWeight: "800", color: BRAND, textAlign: "center", marginTop: 8 },
});
