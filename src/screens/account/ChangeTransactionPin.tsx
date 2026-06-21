import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
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
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

const schema = z
  .object({
    password: z.string().min(6, "Enter your current password"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    pin: z.string().length(4, "PIN must be 4 digits"),
    pin_confirmation: z.string().length(4, "Confirm PIN must be 4 digits"),
  })
  .refine((data) => data.pin === data.pin_confirmation, {
    message: "PINs do not match",
    path: ["pin_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangeTransactionPin() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [pinVisible, setPinVisible] = useState(true);
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
    <View style={[s.root]}>
      {/* Header */}
       <ScreenHeader
          title="Change Transaction PIN"
          subtitle="Update your 4-digit transaction PIN"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"       
        />

      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="dialpad" size={20} color={BLUE} />
          <Text style={s.infoText}>
            Enter your password and the OTP sent to your email, then set a new 4-digit PIN.
          </Text>
        </View>

        <View style={s.form}>
          {/* Current Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Current Password"
                secureTextEntry={passwordVisible}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                mode="outlined"
                placeholder="Enter your current password"
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordVisible((prev) => !prev)}
                    icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          {/* OTP */}
          <Controller
            control={control}
            name="otp"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="OTP"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
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
            control={control}
            name="pin"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="New PIN"
                secureTextEntry={pinVisible}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                placeholder="Enter a new 4-digit PIN"
                mode="outlined"
                right={
                  <TextInput.Icon
                    onPress={() => setPinVisible((prev) => !prev)}
                    icon={pinVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          {/* Confirm PIN */}
          <Controller
            control={control}
            name="pin_confirmation"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Confirm PIN"
                secureTextEntry={pinConfirmVisible}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                placeholder="Confirm your new 4-digit PIN"
                mode="outlined"
                right={
                  <TextInput.Icon
                    onPress={() => setPinConfirmVisible((prev) => !prev)}
                    icon={pinConfirmVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
        </View>

        <View style={s.footer}>
          <Button
            style={s.submitBtn}
            contentStyle={s.submitBtnContent}
            mode="contained"
            disabled={isProcessing}
            onPress={onSubmit}
          >
            <Text style={s.submitBtnText}>Reset PIN</Text>
          </Button>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  header:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:          { padding: 16, paddingBottom: 40 },

  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 20 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },

  form:            { gap: 4 },

  footer:          { marginTop: 20 },
  submitBtn:       { borderRadius: 12 },
  submitBtnContent:{ paddingVertical: 6 },
  submitBtnText:   { color: "#fff", fontSize: 15, fontWeight: "700" },
});
