import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSendPhoneOtpMutation } from "@store/redux-api/kycApi";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.PHONE_VERIFICATION>;

export default function PhoneVerificationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [sendOtp, { isLoading }] = useSendPhoneOtpMutation();

  const handleSend = async () => {
    if (!phone || phone.length < 10) {
      showToast({ variant: "warning", message: "Enter a valid phone number." });
      return;

      
    }
    try {
      await sendOtp({ phone }).unwrap();
      navigation.navigate(SCREENS.VERIFICATION_OTP, { phone });
    } catch (e: any) {
      showToast({ variant: "error", message: e?.data?.message ?? "Failed to send OTP." });
    }
  };

  return (
    <View style={[s.root]}>
      <ScreenHeader
  title="Verify Phone Number"
  
  onBack={() => navigation.goBack()}
/>

      <View style={s.body}>
        {/* Illustration */}
        <View style={s.illustration}>
          <MaterialCommunityIcons name="cellphone-message" size={80} color={BLUE} />
        </View>

        <Text style={s.title}>Secure Your Account</Text>
        <Text style={s.subtitle}>
          Verify your phone number to secure your account and start using BinaPay.
        </Text>

        <Text style={s.inputLabel}>Phone Number</Text>
        <View style={s.inputWrap}>
          <View style={s.flag}>
            <Text style={s.flagText}>🇳🇬</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="080 1234 5678"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={14}
          />
        </View>
        <Text style={s.hint}>We will send a 6-digit code to your number.</Text>

        <TouchableOpacity
          style={[s.btn, (!phone || isLoading) && s.btnDisabled]}
          onPress={handleSend}
          disabled={!phone || isLoading}
        >
          <Text style={s.btnText}>{isLoading ? "Sending..." : "Send OTP"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#fff" },
  header:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: BRAND },
  body:        { flex: 1, padding: 24, alignItems: "center" },
  illustration:{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 24, marginTop: 20 },
  title:       { fontSize: 22, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8 },
  subtitle:    { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 },
  inputLabel:  { alignSelf: "flex-start", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap:   { flexDirection: "row", alignItems: "center", width: "100%", borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, marginBottom: 8, backgroundColor: "#f9fafb" },
  flag:        { paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1, borderRightColor: "#e5e7eb" },
  flagText:    { fontSize: 20 },
  input:       { flex: 1, fontSize: 16, color: "#111827", paddingHorizontal: 14, paddingVertical: 14 },
  hint:        { alignSelf: "flex-start", fontSize: 12, color: "#9ca3af", marginBottom: 32 },
  btn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: "700", color: "#fff" },
});
