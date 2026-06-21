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
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from "react-native";
import { formatWithMask } from "react-native-mask-input";
import Toast from "react-native-root-toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { vs } from "react-native-size-matters";
import { z } from "zod";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.NIN_VERIFICATION>;

const schema = z.object({
  nin: z.string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 11, { message: "NIN must be exactly 11 digits" }),
});

type FormValues = z.infer<typeof schema>;

export default function NinVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const user     = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const bottomSheet   = useRef<BottomSheetModalMethods>(null);

  const [isProcessing, setIsProcessing]         = useState(false);
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

  useEffect(() => {
    if (user?.id) setRemainingAttempts(user.verification_attempts);
  }, [user?.id]);

  const openBottomSheet = useCallback(async () => {
    if (await trigger()) {
      setTimeout(() => bottomSheet.current?.present(), 100);
    }
  }, [trigger]);

  const closeBottomSheet = () => bottomSheet.current?.dismiss();

  const onSubmit = handleSubmit(async (form) => {
    try {
      setIsProcessing(true);
      const response = await API.post("/api/v1/kyc/verify-nin", { nin: form.nin });
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
      }
      showToast({ message: "We had trouble verifying your NIN. Please try again.", position: Toast.positions.TOP });
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
          <Text style={s.headerTitle}>NIN Verification</Text>
          <Text style={s.headerSub}>Tier 1 – Basic Verification</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>NIN Verification</Text>
        <Text style={s.subtitle}>
          Verify your NIN for added security and increased transaction limits.
        </Text>

        <Controller
          control={control}
          name="nin"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <MaskedInput
              label="National Identity Number"
              placeholder="Enter your NIN"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
              mask={bvn_nin_mask}
            />
          )}
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
          onPress={openBottomSheet}
          disabled={isProcessing}
        >
          <Text style={s.btnText}>
            {isProcessing ? "Please wait..." : "Start Verification"}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={[vs(250), vs(250)]}
        onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text style={s.sheetTitle}>Please Review</Text>
            <Text style={s.sheetLabel}>Your NIN</Text>
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
