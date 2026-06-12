import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CustomTextInput from "@components/ui/form/TextInput";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { showToast } from "@helpers/toast";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

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

const schema = z
  .object({
    password:         z.string().min(6, "Enter your current password"),
    otp:              z.string().length(6, "OTP must be 6 digits"),
    pin:              z.string().length(4, "PIN must be 4 digits"),
    pin_confirmation: z.string().length(4, "Confirm PIN must be 4 digits"),
  })
  .refine((data) => data.pin === data.pin_confirmation, {
    message: "PINs do not match",
    path: ["pin_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangeTransactionPin() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation();

  // ── All original state + logic — untouched ────────────────────────────────
  const [isProcessing, setIsProcessing]         = useState(false);
  const [passwordVisible, setPasswordVisible]   = useState(true);
  const [pinVisible, setPinVisible]             = useState(true);
  const [pinConfirmVisible, setPinConfirmVisible] = useState(true);

  const { control, handleSubmit, setError, reset } = useForm<FormValues>({
    defaultValues: { password: "", otp: "", pin: "", pin_confirmation: "" },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsProcessing(true);
    try {
      await API.post(routes.api.v1.auth.changetransactionpinreset, data);
      showToast({ message: "Transaction PIN updated successfully" });
      reset();
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      if (errors) {
        for (const [field, messages] of Object.entries(errors)) {
          if (Array.isArray(messages)) {
            setError(field as keyof FormValues, { message: messages.join(", ") });
          }
        }
      } else {
        showToast({ message: "Something went wrong. Try again." });
      }
    } finally {
      setIsProcessing(false);
    }
  });

  const sendOtp = async () => {
    setIsProcessing(true);
    try {
      await API.post(routes.api.v1.auth.changetransactionpinotp);
      showToast({ message: "OTP sent to your registered email" });
    } catch {
      showToast({ message: "Failed to send OTP. Try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Change Transaction PIN</Text>
          <Text style={s.navSub}>Update your 4-digit PIN</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Info banner */}
        <View style={[s.infoCard, IOS_SHADOW]}>
          <MaterialCommunityIcons name="dialpad" size={20} color={BLUE} />
          <Text style={s.infoText}>
            Enter your password and the OTP sent to your email, then set a new 4-digit PIN.
          </Text>
        </View>

        {/* Form card — all four fields grouped in one iOS card */}
        <View style={[s.formCard, IOS_SHADOW]}>

          {/* Current Password */}
          <Controller
            control={control} name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Current Password"
                secureTextEntry={passwordVisible}
                value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message}
                mode="outlined"
                placeholder="Enter your current password"
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordVisible(prev => !prev)}
                    icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          {/* OTP — send button inline */}
          <Controller
            control={control} name="otp"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="OTP"
                keyboardType="numeric"
                value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message}
                placeholder="Enter the OTP sent to your email"
                mode="outlined"
                right={
                  <TextInput.Icon
                    onPress={sendOtp}
                    icon="send"
                    color={BLUE}
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          {/* New PIN */}
          <Controller
            control={control} name="pin"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="New PIN"
                secureTextEntry={pinVisible}
                keyboardType="numeric"
                value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message}
                placeholder="Enter a new 4-digit PIN"
                mode="outlined"
                right={
                  <TextInput.Icon
                    onPress={() => setPinVisible(prev => !prev)}
                    icon={pinVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          {/* Confirm PIN */}
          <Controller
            control={control} name="pin_confirmation"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Confirm PIN"
                secureTextEntry={pinConfirmVisible}
                keyboardType="numeric"
                value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message}
                placeholder="Confirm your new 4-digit PIN"
                mode="outlined"
                right={
                  <TextInput.Icon
                    onPress={() => setPinConfirmVisible(prev => !prev)}
                    icon={pinConfirmVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
        </View>

        {/* Submit */}
        <Button
          style={s.submitBtn}
          contentStyle={s.submitBtnContent}
          mode="contained"
          disabled={isProcessing}
          onPress={onSubmit}>
          <Text style={s.submitBtnText}>Reset PIN</Text>
        </Button>

      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  navBar:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:        { flex: 1, alignItems: "center" },
  navTitle:         { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:           { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:           { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  infoCard:         { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  infoText:         { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
  formCard:         { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 20, gap: 4 },
  submitBtn:        { borderRadius: 14 },
  submitBtnContent: { paddingVertical: 7 },
  submitBtnText:    { color: SURFACE, fontSize: 15, fontWeight: "700" },
});
