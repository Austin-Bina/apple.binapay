import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSendPhoneOtpMutation } from "@store/redux-api/kycApi";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type Props = KYCStackScreenProps<typeof SCREENS.PHONE_VERIFICATION>;

export default function PhoneVerificationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── All original state + logic — untouched ────────────────────────────────
  const [phone, setPhone]            = useState("");
  const [sendOtp, { isLoading }]     = useSendPhoneOtpMutation();

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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Verify Phone Number</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        {/* Hero circle */}
        <View style={s.heroCircle}>
          <MaterialCommunityIcons name="cellphone-message" size={72} color={BLUE} />
        </View>

        <Text style={s.title}>Secure Your Account</Text>
        <Text style={s.subtitle}>
          Verify your phone number to secure your account and start using BinaPay.
        </Text>

        {/* Input */}
        <Text style={s.inputLabel}>Phone Number</Text>
        <View style={[s.inputWrap, IOS_SHADOW]}>
          <View style={s.flag}>
            <Text style={s.flagText}>🇳🇬</Text>
          </View>
          <TextInput
            style={s.input}
            placeholder="080 1234 5678"
            placeholderTextColor={PLACEHOLDER}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={14}
          />
        </View>
        <Text style={s.hint}>We will send a 6-digit code to this number.</Text>

        <TouchableOpacity
          style={[s.btn, (!phone || isLoading) && s.btnDisabled]}
          onPress={handleSend}
          disabled={!phone || isLoading}
          activeOpacity={0.85}>
          <Text style={s.btnText}>{isLoading ? "Sending…" : "Send OTP"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: SURFACE },
  navBar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:    { fontSize: 17, fontWeight: "700", color: BRAND },
  body:        { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 32 },
  heroCircle:  { width: 120, height: 120, borderRadius: 60, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  title:       { fontSize: 24, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subtitle:    { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 20, marginBottom: 32 },
  inputLabel:  { alignSelf: "flex-start", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap:   { flexDirection: "row", alignItems: "center", width: "100%", borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 14, marginBottom: 8, backgroundColor: BG },
  flag:        { paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: SEPARATOR },
  flagText:    { fontSize: 20 },
  input:       { flex: 1, fontSize: 16, color: LABEL, paddingHorizontal: 14, paddingVertical: 14 },
  hint:        { alignSelf: "flex-start", fontSize: 12, color: PLACEHOLDER, marginBottom: 32 },
  btn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: "700", color: SURFACE },
});
