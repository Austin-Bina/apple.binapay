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
import {
  Keyboard, View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from "react-native";
import { formatWithMask } from "react-native-mask-input";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-root-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vs } from "react-native-size-matters";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { z } from "zod";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.BVN_VERIFICATION>;

const schema = z.object({
  bvn: z.string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 11, { message: "BVN must be exactly 11 digits" }),
  account_number: z.string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10, { message: "Account number must be exactly 10 digits" }),
  bank_code: z.string().nonempty("Please select bank"),
});

type FormValues = z.infer<typeof schema>;
type Bank = { name: string; code: string };

export default function BVNVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const bottomSheet   = useRef<BottomSheetModalMethods>(null);

  const [banks, setBanks]                   = useState<Bank[]>([]);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [hasError, setHasError]             = useState(false);
  const [showProgress, setShowProgress]     = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts]     = useState<number | null>(null);

  const { control, handleSubmit, setError, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bvn: "", account_number: "", bank_code: "" },
  });

  const values = watch();
  const { masked } = formatWithMask({ text: values.bvn, mask: bvn_nin_mask });

  const formattedRemainingAttempts = useMemo(() => {
    if (remainingAttempts === null) return null;
    return Math.max(0, customers.bvn_verification_limit - (remainingAttempts ?? 0));
  }, [remainingAttempts]);

  const filteredBanks = useMemo(() =>
    banks.filter((b) => !!b.code)
      .map((b) => ({ label: b.name, id: b.code }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [banks]
  );

  useEffect(() => {
    if (user?.id) setRemainingAttempts(user.verification_attempts);
  }, [user?.id]);

  useEffect(() => {
    API.get(route("bank.list"))
      .then((r) => setBanks(r.data.banks))
      .catch(console.error);
  }, []);

  const openBottomSheet = useCallback(async () => {
    if (await trigger()) {
      Keyboard.dismiss();
      setTimeout(() => bottomSheet.current?.present(), 100);
    }
  }, [trigger]);

  const closeBottomSheet = () => bottomSheet.current?.dismiss();

  const validateBank = useCallback(async () => {
    trigger(["bank_code", "account_number"]).then(async (allGood) => {
      if (!allGood) return;
      try {
        setIsProcessing(true);
        setShowProgress(true);
        setHasError(false);
        setResolvedAccountName("");
        const response = await API.post(route("bank.resolveAccount"), {
          bank_code: values.bank_code,
          account_number: values.account_number,
        });
        const { account_name } = response.data;
        if (account_name) {
          setResolvedAccountName(account_name);
         } else {
           setError("account_number", { message: "Account not found. Check the number and bank." });
         }
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        if (axiosError.response) {
          setError("account_number", { message: axiosError.response.data?.message });
        } else {
          setHasError(true);
        }
      } finally {
        setShowProgress(false);
        setIsProcessing(false);
      }
    });
  }, [values]);
  
  const onSubmit = handleSubmit(async (form) => {
    if (!resolvedAccountName) return;
    try {
      setIsProcessing(true);
      const response = await API.post("/api/v1/kyc/verify-bvn", form);
      dispatch(authSliceActions.updateUser(response.data.user));
      await dispatch(authSliceActions.fetchUserProfile());
      closeBottomSheet();
      navigation.navigate(SCREENS.VERIFICATION_HUB);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message, errors, error_code } = response.data;
        if (message && typeof message === "string") {
          showToast({ message, position: Toast.positions.TOP });
        }
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
            }
          }
          return;
        }
        if (error_code === "client_insufficient_funds") {
          return dispatch(settingsSliceActions.setApplicationError({
            code: "client_insufficient_funds", context: message,
          }));
        }
        setHasError(true);
      }
    } finally {
      setIsProcessing(false);
      closeBottomSheet();
    }
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>BVN Verification</Text>
          <Text style={s.headerSub}>Tier 1 – Basic Verification</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>BVN and Account Name Validation</Text>
        <Text style={s.subtitle}>
          Verify your BVN for added security and increased transaction limits.
        </Text>

        {hasError && (
          <Banner content="We had trouble verifying your account name. Please try again." />
        )}

        <Controller
          control={control}
          name="bvn"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <MaskedInput
              label="Bank Verification Number"
              placeholder="Enter your BVN"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              mask={bvn_nin_mask}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="account_number"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <CustomTextInput
              label="Account Number"
              placeholder="Enter account number"
              keyboardType="numeric"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
            />
          )}
        />

        {showProgress && !resolvedAccountName && (
          <View style={s.progressRow}>
            <ActivityIndicator animating size="small" />
            <Text style={s.progressText}>Verifying account number...</Text>
          </View>
        )}

        {resolvedAccountName && (
          <View style={s.verifiedRow}>
            <VerifiedBadge />
            <Text style={s.verifiedName}>{resolvedAccountName}</Text>
          </View>
        )}

        <DropdownMenuField
          label="Select your bank"
          placeholder="Select bank"
          name="bank_code"
          control={control}
          data={filteredBanks}
          search={true}
        />

        {formattedRemainingAttempts !== null && (
          <View style={s.attemptsBox}>
            <Text style={s.attemptsText}>
              You have{" "}
              <Text style={s.attemptsCount}>{formattedRemainingAttempts}</Text>
              {" "}free verification attempts remaining.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.btn, isProcessing && s.btnDisabled]}
          onPress={resolvedAccountName ? openBottomSheet : validateBank}
          disabled={isProcessing}
        >
          <Text style={s.btnText}>
            {isProcessing ? "Please wait..." : resolvedAccountName ? "Complete Verification" : "Verify Name"}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={[vs(280), vs(280)]}
        onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text style={s.sheetTitle}>Please Review</Text>
            <Text style={s.sheetLabel}>Your BVN</Text>
            <Text style={s.sheetValue}>{masked}</Text>
            <TouchableOpacity
              style={[s.btn, isProcessing && s.btnDisabled, { marginTop: 24 }]}
              onPress={onSubmit}
              disabled={isProcessing}
            >
              <Text style={s.btnText}>
                {isProcessing ? "Verifying..." : "Yes, it's correct"}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#f8f9fb" },
  header:        { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:   { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:     { fontSize: 12, color: "#6b7280" },
  title:         { fontSize: 20, fontWeight: "800", color: BRAND, marginBottom: 6 },
  subtitle:      { fontSize: 14, color: "#6b7280", marginBottom: 20 },
  progressRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  progressText:  { fontSize: 12, color: "#6b7280" },
  verifiedRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  verifiedName:  { fontSize: 14, fontWeight: "600", color: "#2563EB" },
  attemptsBox:   { backgroundColor: "#f9fafb", borderRadius: 10, padding: 12, marginTop: 12 },
  attemptsText:  { fontSize: 13, color: "#6b7280", textAlign: "center" },
  attemptsCount: { color: "#f59e0b", fontWeight: "700" },
  footer:        { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:           { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled:   { opacity: 0.5 },
  btnText:       { fontSize: 16, fontWeight: "700", color: "#fff" },
  sheetTitle:    { fontSize: 18, fontWeight: "700", color: BRAND, textAlign: "center", marginBottom: 16 },
  sheetLabel:    { fontSize: 14, color: "#6b7280", textAlign: "center" },
  sheetValue:    { fontSize: 28, fontWeight: "800", color: BRAND, textAlign: "center", marginTop: 8 },
});
