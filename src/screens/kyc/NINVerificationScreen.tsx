import MaskedInput from "@components/ui/form/mask-input";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { bvn_nin_mask } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { formatWithMask } from "react-native-mask-input";
import Toast from "react-native-root-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vs } from "react-native-size-matters";
import { z } from "zod";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

type Props = KYCStackScreenProps<typeof SCREENS.NIN_VERIFICATION>;

const schema = z.object({
  nin: z.string().transform(v => v.replace(/\D/g, "")).refine(v => v.length === 11, { message: "NIN must be exactly 11 digits" }),
});
type FormValues = z.infer<typeof schema>;

export default function NinVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const bottomSheet   = useRef<BottomSheetModalMethods>(null);

  // ── All original state + logic — untouched ────────────────────────────────
  const [isProcessing, setIsProcessing]           = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const { control, handleSubmit, setError, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nin: "" },
    mode: "onChange",
  });

  const values = watch();
  const { masked } = formatWithMask({ text: values.nin, mask: bvn_nin_mask });

  const formattedRemainingAttempts = useMemo(() => {
    if (remainingAttempts === null) return null;
    return Math.max(0, customers.nin_verification_limit - (remainingAttempts ?? 0));
  }, [remainingAttempts]);

  useEffect(() => { if (user?.id) setRemainingAttempts(user.verification_attempts); }, [user?.id]);

  const openBottomSheet = useCallback(async () => {
    if (await trigger()) setTimeout(() => bottomSheet.current?.present(), 100);
  }, [trigger]);
  const closeBottomSheet = () => bottomSheet.current?.dismiss();

  const onSubmit = handleSubmit(async form => {
    try {
      setIsProcessing(true);
      const response = await API.post("/api/v1/kyc/verify-nin", { nin: form.nin });
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
            if (Array.isArray(fieldErrors)) setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
          }
          return;
        }
        if (error_code === "client_insufficient_funds") {
          return dispatch(settingsSliceActions.setApplicationError({ code: "client_insufficient_funds", context: message }));
        }
      }
      showToast({ message: "We had trouble verifying your NIN. Please try again.", position: Toast.positions.TOP });
    } finally { setIsProcessing(false); closeBottomSheet(); }
  });

  return (
    <View style={[n.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={n.navBar}>
        <TouchableOpacity style={n.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={n.navCenter}>
          <Text style={n.navTitle}>NIN Verification</Text>
          <Text style={n.navSub}>Tier 1 – Basic Verification</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={n.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={n.title}>NIN Verification</Text>
        <Text style={n.subtitle}>Verify your NIN for added security and increased transaction limits.</Text>

        <View style={[n.formCard, IOS_SHADOW]}>
          <Controller control={control} name="nin"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput label="National Identity Number" placeholder="Enter your NIN" mode="outlined"
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} mask={bvn_nin_mask} />
            )}
          />
        </View>

        {formattedRemainingAttempts !== null && (
          <View style={[n.attemptsCard, IOS_SHADOW]}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#D97706" />
            <Text style={n.attemptsText}>
              You have <Text style={n.attemptsCount}>{formattedRemainingAttempts}</Text> free verification attempts remaining.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[n.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
        <TouchableOpacity style={[n.btn, isProcessing && n.btnDisabled]} onPress={openBottomSheet}
          disabled={isProcessing} activeOpacity={0.85}>
          <Text style={n.btnText}>{isProcessing ? "Please wait…" : "Start Verification"}</Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal ref={bottomSheet} initialSnapPoints={[vs(250), vs(250)]} onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text style={n.sheetTitle}>Please Review</Text>
            <Text style={n.sheetLabel}>Your NIN</Text>
            <Text style={n.sheetValue}>{masked}</Text>
            <TouchableOpacity style={[n.btn, isProcessing && n.btnDisabled, { marginTop: 24 }]}
              onPress={onSubmit} disabled={isProcessing} activeOpacity={0.85}>
              <Text style={n.btnText}>{isProcessing ? "Verifying…" : "Yes, it's correct"}</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const n = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:    { flex: 1, alignItems: "center" },
  navTitle:     { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:       { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  title:        { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 6 },
  subtitle:     { fontSize: 14, color: SUBLABEL, marginBottom: 20 },
  formCard:     { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 14 },
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
